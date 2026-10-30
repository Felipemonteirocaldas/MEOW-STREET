import { setDogUntil, dogVisible } from "../world/dog.js";
import { S, awayDays, gameOver } from "../game/state.js";
import { CH, CW, DPR, IH, P, T, box, clamp100, cv, depthOf, g, poly, resize, view } from "./draw.js";
import { dex, say, updateDex } from "../characters/dex.js";
import { drawRoach, shakeUntil, updateRoach } from "../characters/roach.js";
import { cat, catTipTick, drawCat, falling, heartFx, updateCat, updateFalling } from "../characters/cat.js";
import { camAnim, toScreen, updateCam, viewM } from "./camera.js";
import { drawObj, drawRoom } from "../world/rooms.js";
import { O } from "../furniture/core.js";
import { drawTrashAt, isLive } from "../furniture/catalog-map.js";
import { WALL_PIECES } from "./layout.js";
import { drawDex } from "../characters/dex-draw.js";
import { drawDarkness, glows } from "../world/lighting.js";
import { drawHighlight, hover, tapFlash } from "./input.js";
import { bubble } from "../ui/sheets.js";
import { bd1, termBubble } from "../characters/bd1.js";
import { owns } from "../game/catalog.js";
import { floats } from "../ui/overlays.js";
import { tr } from "../lang.js";

// ---------- loop ----------
let last = performance.now();
function frame(t) {
  const dt = Math.min((t - last) / 1000, 0.1); last = t;
  if (S.vacation) { requestAnimationFrame(frame); return; } // away in Acapulco: the apartment sleeps
  if (!dogVisible() && Math.random() < dt / 240) setDogUntil(Date.now() + 25000);
  if (S.radio) S.needs.diversao = clamp100(S.needs.diversao + 0.03 * dt);
  updateDex(dt); updateRoach(dt); updateCat(dt); catTipTick(dt); updateFalling(Date.now());
  if (document.body.classList.contains("focus")) { requestAnimationFrame(frame); return; } // panel mode: the apartment keeps living but isn't drawn
  const fade = updateCam(dt), m = viewM();
  if (Date.now() < shakeUntil) { m[4] += (Math.random() - 0.5) * 8 * DPR; m[5] += (Math.random() - 0.5) * 8 * DPR; } // screen shake
  g.setTransform(DPR, 0, 0, DPR, 0, 0); g.fillStyle = "#050507"; g.fillRect(0, 0, CW, CH);
  g.setTransform(...m);
  drawRoom();
  const items = O.filter(o => o.boxes && isLive(o)).map(o => { const bs = o.boxes(); return bs.length && { depth: depthOf(bs), draw: () => drawObj(o, bs) }; }).filter(Boolean);
  for (const b of WALL_PIECES) items.push({ depth: b.x + b.w / 2 + b.y + b.d / 2, draw: () => { box(b); poly([P(b.x, b.y, IH), P(b.x + b.w, b.y, IH), P(b.x + b.w, b.y + b.d, IH), P(b.x, b.y + b.d, IH)], "#1c1c21"); } });
  items.push({ depth: dex.x + dex.y + (dex.sit ? 0.1 : 0), draw: drawDex });
  items.push({ depth: cat.x + cat.y + ((cat.state === "sleep" && cat.napZ) || cat.z > 0.05 ? 0.6 : 0), draw: drawCat });
  if (falling && falling.pos) items.push({ depth: falling.pos[0] + falling.pos[1] + 0.8, draw: () => drawTrashAt(falling.i, ...falling.pos) });
  items.sort((a, b) => a.depth - b.depth).forEach(i => i.draw());
  drawDarkness(m);
  g.setTransform(...m); glows(); drawRoach();
  if (hover && !camAnim) drawHighlight(hover, false);
  if (tapFlash && Date.now() < tapFlash.until) drawHighlight(tapFlash.tg, true);
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (dex.say && Date.now() < dex.sayUntil && !camAnim) { const [hx, hy] = toScreen(P(dex.x, dex.y)[0], dex.top); bubble(dex.say, hx, hy); }
  if (cat.say && Date.now() < cat.sayUntil && !camAnim) bubble(cat.say, ...toScreen(P(cat.x, cat.y)[0], cat.top));
  for (let i = heartFx.length - 1; i >= 0; i--) {
    const h = heartFx[i]; h.t += dt; if (h.t > 1.4) { heartFx.splice(i, 1); continue; } if (h.t < 0) continue;
    const [hx, hy] = toScreen(...P(cat.x + h.dx, cat.y, 0.4 + h.t * 0.9));
    g.globalAlpha = 1 - h.t / 1.4; g.fillStyle = "#e0262e"; g.font = `${12 + h.t * 6}px serif`; g.fillText("♥", hx, hy); g.globalAlpha = 1;
  }
  if (Date.now() > bd1.at && Date.now() < bd1.until && !camAnim) { const [px, py] = P(4.7, 0.4, owns("desk") ? 1.55 : 1.35); termBubble(bd1.text, ...toScreen(px, py)); }
  for (let i = floats.length - 1; i >= 0; i--) {
    const f = floats[i]; f.t += dt; if (f.t > 1.6) { floats.splice(i, 1); continue; }
    g.globalAlpha = Math.min(1, 2 - f.t * 1.25); g.fillStyle = "#e0262e"; g.font = "700 16px 'Special Elite', serif"; g.textAlign = "center";
    g.fillText(f.text, CW / 2, 40 - f.t * 12); g.textAlign = "left"; g.globalAlpha = 1;
  }
  if (fade) { g.fillStyle = `rgba(0,0,0,${fade})`; g.fillRect(0, 0, CW, CH); }
  requestAnimationFrame(frame);
}
// observe the canvas itself: the stage reflows after load (fonts, HUD), and a stale CW/CH stretches the drawing away from the pointer
const fit = () => { if (!cv.clientWidth) return; resize(); [view.fx, view.fy] = P(dex.x, dex.y, 0.6); }; // re-centre on Dex whenever the canvas size changes
new ResizeObserver(fit).observe(cv); fit();
if (awayDays >= 1 && !gameOver && !S.vacation) setTimeout(() => say(tr(awayDays >= 4 ? "{d} dias. Não me deixa sozinho assim de novo." : "Sumiu por {d} dia(s). Achei que tinha me esquecido.", { d: awayDays }), 6000), 1500);
requestAnimationFrame(frame);
