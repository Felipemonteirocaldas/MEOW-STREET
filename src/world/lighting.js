import { dayPhase } from "../game/clock.js";
import { powerCut } from "../game/bills.js";
import { CH, CW, P, T, dg, dk, g } from "../engine/draw.js";
import { owns } from "../game/catalog.js";
import { S } from "../game/state.js";
import { RACKS } from "../furniture/core.js";
import { tv } from "../ui/overlays.js";

// ---------- noir lighting: darkness layer with light pools cut out of it ----------
function lights() {
  const ph = dayPhase(), on = !powerCut(), L = [];
  const add = (p, r, a = 1) => L.push([p, r, a]);
  add(P(2.1, 1.4), T * 2.4, ph === "day" ? 0.9 : 0.45); add(P(8.0, 1.4), T * 1.8, ph === "day" ? 0.8 : 0.35); add(P(0.8, 6.9), T * 1.6, ph === "day" ? 0.7 : 0.3);
  if (on) {
    if (owns("lamp") && !S.lampOff) add(P(0.5, 4.0, 0.4), T * 3.4);
    add(P(4.9, 0.6, 0.6), T * 1.6, 0.7); // R2-DEBT's screen glow
    if (owns("desk")) add(P(5.4, 0.4, 0.8), T * 1.8);
    if (owns("ktable")) add(P(9.45, 2.4, 0.3), T * 3.2); else add(P(9.0, 1.5, 0.3), T * 2.2, 0.6); // bare bulb in the kitchen
    if (RACKS().length) add(P(10.4, 6.6, 0.5), T * 3.2, 0.8);
    add(P(0.3, 7.8, 0.6), T * 2.2, 0.8); add(P(5.5, 8, 0.4), T * 2.6, 0.8);
    if (tv) add(P(1.2, 2.7, 0.6), T * 3.2);
  }
  return L;
}
export function drawDarkness(m) {
  const ph = dayPhase();
  dg.setTransform(1, 0, 0, 1, 0, 0); dg.globalCompositeOperation = "source-over"; dg.clearRect(0, 0, dk.width, dk.height);
  dg.setTransform(...m);
  dg.fillStyle = `rgba(3,3,8,${{ day: 0.42, dusk: 0.58, night: 0.68 }[ph]})`; dg.fillRect(-CW * 2, -CH * 2, CW * 6, CH * 6);
  dg.globalCompositeOperation = "destination-out";
  for (const [[x, y], r, a] of lights()) {
    const gr = dg.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, "rgba(0,0,0,0)");
    dg.fillStyle = gr; dg.fillRect(x - r, y - r, r * 2, r * 2);
  }
  dg.fillStyle = `rgba(0,0,0,${ph === "day" ? 0.55 : 0.3})`; // venetian-blind stripes across the living room floor
  for (let k = 0; k < 6; k++) {
    const y0 = 0.3 + k * 0.42, y1 = y0 + 0.2, s = (y) => y * 0.35, Q = (x, y) => P(x, y);
    const pts = [Q(1.2 + s(y0), y0), Q(3.0 + s(y0), y0), Q(3.0 + s(y1), y1), Q(1.2 + s(y1), y1)];
    dg.beginPath(); pts.forEach(([x, y], i) => i ? dg.lineTo(x, y) : dg.moveTo(x, y)); dg.fill();
  }
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); if (dk.width && dk.height) g.drawImage(dk, 0, 0); /* panel mode hides the stage: 0x0 canvas */ g.restore();
}
export function glows() {
  const ph = dayPhase(), t = Date.now() / 1000;
  g.globalCompositeOperation = "lighter";
  const glow = (p, r, c) => { const gr = g.createRadialGradient(p[0], p[1], 0, p[0], p[1], r); gr.addColorStop(0, c); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(p[0] - r, p[1] - r, r * 2, r * 2); };
  if (!powerCut()) {
    if (!S.lampOff) glow(P(0.5, 4, 1.55), T * 2.4, "rgba(255,190,110,.16)");
    glow(P(5.4, 0.4, 1.0), T * 1.0, "rgba(90,200,140,.12)");
    glow(P(9.45, 2.4, 1.6), T * 2, "rgba(255,200,130,.12)");
    if (tv) glow(P(0.8, 2.6, 0.9), T * 3, `rgba(180,200,255,${0.1 + Math.random() * 0.08})`);
  }
  if (ph !== "day" && Math.floor(t * 8) % 13) glow(P(2.1, 0.5, 1.5), T * 2.2, "rgba(220,20,30,.12)"); // neon from across the street
  if (S.radio) { glow(P(0.4, 5.3, 0.9), T * 1.4, "rgba(224,168,58,.18)"); g.globalCompositeOperation = "source-over"; g.fillStyle = "#d8d4cc"; g.font = `${T * 0.4}px serif`; const [x, y] = P(0.4, 4.9, 1.3); g.fillText("♪", x + Math.sin(t * 2) * 4, y - (t * 10 % 20)); }
  g.globalCompositeOperation = "source-over";
}

