import { dayPhase } from "./game/clock.js";
import { OPTS } from "./menu.js";
import { activeMods } from "./game/production.js";
import { tr } from "./lang.js";
import { dogVisible } from "./world/dog.js";
import { S } from "./game/state.js";
import { pick } from "./engine/draw.js";
import { dex } from "./characters/dex.js";

// Front view of NYC from Dex's window, film-noir style: grey city, rain, fog, wet street, one red neon. Light follows the real clock.
const viewEl = document.getElementById("view"), cc = document.getElementById("city"), c2 = cc.getContext("2d");
const VW = 400, VH = 500;
let cityOn = false, cityLast = 0, flash = 0;
let cs = 1986; const cr = () => (cs = (cs * 16807) % 2147483647) / 2147483647;

const PAL = {
  day:   { sky: ["#5d636b", "#8a9097", "#aeb3b8"], far: "#6c7178", farSide: "#5f646b", near: "#3e4248", nearSide: "#34373c", on: null, water: ["#55606a", "#3c444c"], road: "#2c2f33", lit: false },
  dusk:  { sky: ["#1d1a24", "#4a3a44", "#7a5a58"], far: "#2a2830", farSide: "#232128", near: "#1d1b21", nearSide: "#17161b", on: "#cfa65a", water: ["#2a2a33", "#16161c"], road: "#141418", lit: true },
  night: { sky: ["#030305", "#0d0e14", "#1d1f28"], far: "#101117", farSide: "#0b0c11", near: "#0a0a0e", nearSide: "#060609", on: "#d9b45a", water: ["#0c0d13", "#050507"], road: "#0a0a0d", lit: true },
};

function layer(base, hMin, hMax, wMin, wMax, step) {
  const bs = [];
  for (let x = -6; x < VW + 6;) {
    const w = wMin + cr() * (wMax - wMin), h = hMin + cr() * (hMax - hMin), wins = [];
    for (let wy = base - h + 6; wy < base - 5; wy += step + 2) for (let wx = x + 3; wx < x + w * 0.7 - 2; wx += step) wins.push({ x: wx, y: wy, on: cr() < 0.3 });
    bs.push({ x, w, h, wins, cap: cr() }); x += w + 1 + cr() * 3;
  }
  return { base, bs };
}
const FAR = layer(282, 30, 110, 12, 26, 4), NEAR = layer(425, 40, 95, 34, 60, 6);
const DROPS = Array.from({ length: 140 }, () => [cr() * VW, cr() * VH, 8 + cr() * 10]);
const CABS = Array.from({ length: 3 }, (_, i) => ({ x: cr() * VW, dir: i % 2 ? 1 : -1, v: 40 + cr() * 30 }));
const EMPIRE = Array.from({ length: 60 }, () => [cr(), cr(), cr() < 0.4]);
const STEAM = [];

function body(x, top, w, h, c, side) { c2.fillStyle = c; c2.fillRect(x, top, w, h); c2.fillStyle = side; c2.fillRect(x + w * 0.7, top, w * 0.3, h); }
function empire(x, base, p, t) {
  body(x - 22, base - 150, 44, 150, p.far, p.farSide); body(x - 15, base - 185, 30, 35, p.far, p.farSide); body(x - 9, base - 210, 18, 25, p.far, p.farSide);
  body(x - 5, base - 225, 10, 15, p.far, p.farSide); c2.fillStyle = p.farSide; c2.fillRect(x - 1.5, base - 255, 3, 30);
  if (p.lit) { c2.fillStyle = "rgba(220,200,160,.25)"; c2.fillRect(x - 9, base - 210, 18, 25); for (const [u, v, on] of EMPIRE) if (on) { c2.fillStyle = p.on; c2.fillRect(x - 19 + u * 26, base - 145 + v * 135, 2, 3); } }
  if (Math.sin(t * 3) > 0) { c2.fillStyle = "#e0262e"; c2.beginPath(); c2.arc(x, base - 256, 2.2, 0, 7); c2.fill(); }
}
function chrysler(x, base, p) {
  body(x - 14, base - 165, 28, 165, p.far, p.farSide);
  for (let i = 0; i < 4; i++) {
    const r = 13 - i * 3, y = base - 165 - i * 9;
    c2.fillStyle = p.lit ? "#2a2c36" : "#7d838b"; c2.beginPath(); c2.arc(x, y, r, Math.PI, 0); c2.fill();
    if (p.lit) { c2.fillStyle = "#e8d9a8"; for (const dx of [-r * 0.6, 0, r * 0.6]) { c2.beginPath(); c2.moveTo(x + dx - 1.5, y - 1); c2.lineTo(x + dx, y - r * 0.6); c2.lineTo(x + dx + 1.5, y - 1); c2.fill(); } }
  }
  c2.fillStyle = "#9aa0a8"; c2.beginPath(); c2.moveTo(x - 2.5, base - 195); c2.lineTo(x, base - 240); c2.lineTo(x + 2.5, base - 195); c2.fill();
}
function waterTower(x, top, p) {
  c2.strokeStyle = p.nearSide; c2.lineWidth = 1;
  c2.beginPath(); c2.moveTo(x + 1, top); c2.lineTo(x + 1, top - 6); c2.moveTo(x + 8, top); c2.lineTo(x + 8, top - 6); c2.stroke();
  c2.fillStyle = p.nearSide; c2.fillRect(x, top - 14, 9, 8);
  c2.beginPath(); c2.moveTo(x - 1, top - 14); c2.lineTo(x + 4.5, top - 19); c2.lineTo(x + 10, top - 14); c2.fill();
}
function drawLayer(L, p, far) {
  for (const b of L.bs) {
    const top = L.base - b.h;
    body(b.x, top, b.w, b.h, far ? p.far : p.near, far ? p.farSide : p.nearSide);
    if (!far && b.cap < 0.35) waterTower(b.x + b.w * 0.25, top, p);
    if (p.on) { c2.fillStyle = p.on; for (const w of b.wins) if (w.on) c2.fillRect(w.x, w.y, far ? 2 : 3, far ? 3 : 4); }
  }
}
function fog(y, h, a) { const f = c2.createLinearGradient(0, y, 0, y + h); f.addColorStop(0, "rgba(160,165,175,0)"); f.addColorStop(0.5, `rgba(160,165,175,${a})`); f.addColorStop(1, "rgba(160,165,175,0)"); c2.fillStyle = f; c2.fillRect(0, y, VW, h); }

function drawCity(t, dt) {
  const ph = dayPhase(), p = PAL[ph];
  const sky = c2.createLinearGradient(0, 0, 0, 282);
  sky.addColorStop(0, p.sky[0]); sky.addColorStop(0.6, p.sky[1]); sky.addColorStop(1, p.sky[2]);
  c2.fillStyle = sky; c2.fillRect(0, 0, VW, 282);
  if (ph === "night") { c2.fillStyle = "rgba(220,220,230,.5)"; c2.beginPath(); c2.arc(320, 60, 14, 0, 7); c2.fill(); fog(40, 50, 0.25); } // moon behind clouds

  chrysler(120, 282, p); empire(255, 282, p, t);
  drawLayer(FAR, p, true);
  fog(220, 90, ph === "day" ? 0.35 : 0.18);

  const water = c2.createLinearGradient(0, 282, 0, 340); water.addColorStop(0, p.water[0]); water.addColorStop(1, p.water[1]);
  c2.fillStyle = water; c2.fillRect(0, 282, VW, 60);
  if (p.lit) for (const b of FAR.bs) for (const w of b.wins) if (w.on && w.y > 240) { c2.globalAlpha = 0.25 + 0.2 * Math.sin(t * 3 + w.x); c2.fillStyle = p.on; c2.fillRect(w.x, 282 + (282 - w.y) * 0.5, 2, 1); }
  c2.globalAlpha = 1;
  c2.fillStyle = p.farSide; c2.fillRect(-10, 316, VW + 20, 4); // bridge deck in the fog
  for (const tx of [70, 330]) { c2.fillRect(tx - 8, 250, 16, 70); }
  c2.strokeStyle = p.farSide; c2.lineWidth = 1; c2.beginPath(); c2.moveTo(-10, 310); c2.quadraticCurveTo(40, 300, 70, 250); c2.quadraticCurveTo(200, 330, 330, 250); c2.quadraticCurveTo(360, 300, 410, 310); c2.stroke();

  drawLayer(NEAR, p, false);
  // red neon hotel sign: the only colour in the picture
  const flick = ph !== "day" && (!OPTS.flashes || Math.floor(t * 8) % 13 !== 0);
  c2.fillStyle = "#121216"; c2.fillRect(300, 330, 26, 80);
  c2.font = "bold 15px Georgia, serif"; c2.fillStyle = flick ? "#ff2a35" : "#5a1418";
  if (flick) { c2.shadowColor = "#ff2a35"; c2.shadowBlur = 14; }
  "HOTEL".split("").forEach((ch, i) => c2.fillText(ch, 307, 348 + i * 15)); c2.shadowBlur = 0;
  // rooftop billboard: a diegetic ad slot
  const ad = activeMods().find(m => m.sponsored), bb = NEAR.bs.find(b => b.x <= 150 && b.x + b.w >= 150) || NEAR.bs[0], btop = NEAR.base - bb.h;
  c2.fillStyle = "#1b1b1f"; c2.fillRect(122, btop - 10, 2, 10); c2.fillRect(176, btop - 10, 2, 10);
  c2.fillStyle = ph === "day" ? "#8a8f96" : "#2a2a30"; c2.fillRect(108, btop - 34, 84, 24);
  c2.fillStyle = "#e8e4dc"; c2.font = "bold 10px Georgia, serif"; c2.textAlign = "center";
  c2.fillText(ad ? ad.advertiser.toUpperCase() : tr("BEBA MAIS CAFÉ"), 150, btop - 18); c2.textAlign = "left";

  // wet street with reflections
  c2.fillStyle = p.nearSide; c2.fillRect(0, 425, VW, 8);
  c2.fillStyle = p.road; c2.fillRect(0, 433, VW, 67);
  if (flick) { c2.fillStyle = "rgba(255,42,53,.18)"; c2.fillRect(296, 440, 34, 50); }
  for (const lx of [60, 200, 340]) {
    c2.fillStyle = "#050507"; c2.fillRect(lx, 392, 2, 41); c2.fillRect(lx - 6, 392, 10, 3);
    if (p.lit) { const gl = c2.createRadialGradient(lx - 2, 398, 0, lx - 2, 440, 55); gl.addColorStop(0, "rgba(230,210,160,.28)"); gl.addColorStop(1, "rgba(230,210,160,0)"); c2.fillStyle = gl; c2.fillRect(lx - 57, 395, 114, 105);
      c2.fillStyle = "rgba(230,210,160,.15)"; c2.fillRect(lx - 3, 440, 6, 45); }
  }
  for (const cab of CABS) {
    cab.x += cab.dir * cab.v * dt; if (cab.x > VW + 40) cab.x = -40; if (cab.x < -40) cab.x = VW + 40;
    const y = cab.dir > 0 ? 455 : 488;
    c2.fillStyle = "#3a3a40"; c2.fillRect(cab.x, y - 9, 30, 8); c2.fillRect(cab.x + 8, y - 14, 14, 5);
    c2.fillStyle = "#050505"; c2.beginPath(); c2.arc(cab.x + 7, y, 3, 0, 7); c2.arc(cab.x + 23, y, 3, 0, 7); c2.fill();
    const front = cab.dir > 0 ? cab.x + 30 : cab.x - 2;
    c2.fillStyle = "#f2ead0"; c2.fillRect(front, y - 7, 2, 2);
    c2.fillStyle = "rgba(242,234,208,.18)"; c2.beginPath(); c2.moveTo(front, y - 6); c2.lineTo(front + cab.dir * 50, y - 14); c2.lineTo(front + cab.dir * 50, y + 4); c2.fill();
    c2.fillStyle = "rgba(242,234,208,.1)"; c2.fillRect(cab.x, y + 4, 30, 6); // reflection on wet asphalt
  }
  if (Math.random() < dt * 5) STEAM.push({ x: 120 + Math.random() * 6, y: 495, r: 4, a: 0.45 });
  for (let i = STEAM.length - 1; i >= 0; i--) {
    const s = STEAM[i]; s.y -= dt * 16; s.r += dt * 7; s.a -= dt * 0.22; s.x += Math.sin(t + i) * 0.2;
    if (s.a <= 0) { STEAM.splice(i, 1); continue; }
    c2.fillStyle = `rgba(200,200,205,${s.a})`; c2.beginPath(); c2.arc(s.x, s.y, s.r, 0, 7); c2.fill();
  }
  if (typeof dogVisible === "function" && dogVisible()) { const b = NEAR.bs[2], top = NEAR.base - b.h; c2.fillStyle = "#000"; c2.beginPath(); c2.ellipse(b.x + 14, top - 5, 7, 5, 0, 0, 7); c2.arc(b.x + 20, top - 10, 4, 0, 7); c2.fill(); c2.fillStyle = "#e0262e"; c2.fillRect(b.x + 21, top - 11, 1.5, 1.5); }

  // real NYC weather: rain, snow, fog, lightning only in a real thunderstorm
  const wx = S.weather || {};
  if (wx.rain) {
    c2.strokeStyle = ph === "day" ? "rgba(230,232,236,.35)" : "rgba(180,185,195,.3)"; c2.lineWidth = 1; c2.beginPath();
    for (const d of DROPS) { d[1] = (d[1] + dt * 520) % VH; c2.moveTo(d[0], d[1]); c2.lineTo(d[0] - 3, d[1] + d[2]); } c2.stroke();
  }
  if (wx.snow) { c2.fillStyle = "rgba(240,240,245,.85)"; for (const d of DROPS) { d[1] = (d[1] + dt * 40) % VH; c2.fillRect(d[0] + Math.sin(t + d[2]) * 4, d[1], 2.2, 2.2); } }
  if (wx.fog) fog(150, 300, 0.4);
  if (wx.storm && OPTS.flashes && Math.random() < dt / 20) flash = 1;
  if (flash > 0) { c2.fillStyle = `rgba(230,235,255,${flash * 0.5})`; c2.fillRect(0, 0, VW, VH); flash -= dt * 4; }

  // window frame, blinds half down, drops on the glass
  c2.fillStyle = "#1b1b1f";
  c2.fillRect(0, 0, VW, 14); c2.fillRect(0, VH - 22, VW, 22); c2.fillRect(0, 0, 14, VH); c2.fillRect(VW - 14, 0, 14, VH);
  c2.fillRect(VW / 2 - 5, 0, 10, VH); c2.fillRect(0, VH * 0.46, VW, 10);
  for (let i = 0; i < 12; i++) { c2.fillStyle = "#b9b4aa"; c2.fillRect(14, 14 + i * 7, VW - 28, 5); c2.fillStyle = "rgba(0,0,0,.35)"; c2.fillRect(14, 19 + i * 7, VW - 28, 2); }
  c2.fillStyle = "rgba(255,255,255,.05)"; c2.beginPath(); c2.moveTo(40, VH); c2.lineTo(160, 100); c2.lineTo(200, 100); c2.lineTo(80, VH); c2.fill();
}

function cityFrame(ts) {
  if (!cityOn) return;
  const t = ts / 1000, dt = Math.min(t - cityLast, 0.1); cityLast = t;
  if (PAL[dayPhase()].lit && Math.random() < 0.3) { const b = pick(pick([FAR, NEAR]).bs); if (b.wins.length) { const w = pick(b.wins); w.on = !w.on; } }
  drawCity(t, dt);
  requestAnimationFrame(cityFrame);
}
export function openCity() {
  const dpr = window.devicePixelRatio || 1, w = Math.min(innerWidth * 0.92, 440, innerHeight * 0.78 * VW / VH);
  cc.style.width = w + "px"; cc.style.height = w * VH / VW + "px";
  cc.width = w * dpr; cc.height = w * VH / VW * dpr;
  c2.setTransform(w * dpr / VW, 0, 0, w * dpr / VW, 0, 0);
  viewEl.hidden = false; cityOn = true; cityLast = performance.now() / 1000;
  requestAnimationFrame(cityFrame);
}
viewEl.addEventListener("ovclose", () => { cityOn = false; dex.idle = 6; });
viewEl.addEventListener("click", e => { if (e.target === cc) return; viewEl.hidden = true; cityOn = false; dex.idle = 6; });
