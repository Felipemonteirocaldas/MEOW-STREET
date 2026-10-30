import { bounces } from "./bounce.js";
import { D, EDGE, P, RAIN, RH, SKY, T, W, box, faceX, faceY, g, line, poly } from "../engine/draw.js";
import { dayPhase, nyc } from "../game/clock.js";
import { S, now } from "../game/state.js";
import { dogVisible } from "./dog.js";
import { ROOMS } from "../engine/layout.js";
import { owns } from "../game/catalog.js";
import { LOCALE, tr } from "../lang.js";
import { ringing } from "../ui/phone.js";
import { drawTrash } from "../furniture/catalog-map.js";

// ---------- walls, floors, windows ----------
const FLOOR = { wood: "#3b322b", dark: "#2a2420", carpet: "#2b2d36", tile: "#8f979c", checker: "#c9c9c9" };
function drawFloor(r) {
  poly([P(r.x0, r.y0), P(r.x1, r.y0), P(r.x1, r.y1), P(r.x0, r.y1)], FLOOR[r.floor]);
  if (r.floor === "checker") {
    for (let x = r.x0; x < r.x1; x += 0.5) for (let y = r.y0; y < r.y1; y += 0.5)
      if (((x + y) * 2) % 2 === 0) poly([P(x, y), P(x + 0.5, y), P(x + 0.5, y + 0.5), P(x, y + 0.5)], "#1e1e22");
  } else if (r.floor === "tile") {
    for (let x = r.x0; x <= r.x1; x += 0.25) line(P(x, r.y0), P(x, r.y1), "rgba(0,0,0,.18)");
    for (let y = r.y0; y <= r.y1; y += 0.25) line(P(r.x0, y), P(r.x1, y), "rgba(0,0,0,.18)");
  } else if (r.floor !== "carpet") {
    for (let x = r.x0 + 0.5; x < r.x1; x += 0.5) line(P(x, r.y0), P(x, r.y1), "rgba(0,0,0,.28)");
  }
}
function windowView(w, h, opts = {}) {
  const ph = dayPhase(), t = Date.now() / 1000;
  const top = { day: "#7d838b", dusk: "#3a3040", night: "#07080c" }[ph], low = { day: "#b9bdc2", dusk: "#7a4a4a", night: "#1c1f2a" }[ph];
  g.fillStyle = "#1b1b1f"; g.fillRect(-8, -8, w + 16, h + 16);
  const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, top); sky.addColorStop(1, low);
  g.fillStyle = sky; g.fillRect(0, 0, w, h);
  for (const b of SKY) {
    if (b.x > w) continue;
    g.fillStyle = ph === "day" ? "#55595f" : "#0c0d12"; g.fillRect(b.x, h - b.h, Math.min(b.w, w - b.x), b.h);
    g.fillStyle = "#d9b45a";
    if (ph !== "day") for (const [lx, ly, on] of b.lit) if (on > 0.55) g.fillRect(b.x + 2 + lx * (b.w - 5), h - b.h + 4 + ly * (b.h - 8), 2.5, 3.5);
  }
  if (opts.neon && ph !== "day" && Math.floor(t * 8) % 13) { g.fillStyle = "#e0262e"; g.font = "bold 16px serif"; g.fillText("HOT", w - 44, 40); }
  const wx = S.weather || {}; // real NYC weather from the server
  if (wx.rain) { g.strokeStyle = "rgba(200,210,220,.35)"; g.lineWidth = 1; for (const [rx, ry] of RAIN) { const y = ((ry + t * 1.4) % 1) * h, x = rx * w; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 2, y + 7); g.stroke(); } }
  if (wx.snow) { g.fillStyle = "rgba(240,240,245,.8)"; for (const [rx, ry] of RAIN) g.fillRect(rx * w + Math.sin(t + ry * 9) * 3, ((ry + t * 0.15) % 1) * h, 2, 2); }
  if (wx.fog) { g.fillStyle = "rgba(170,175,185,.35)"; g.fillRect(0, h * 0.4, w, h * 0.6); }
  if (opts.escape) { // fire escape
    g.strokeStyle = "#050505"; g.lineWidth = 3; g.beginPath(); g.moveTo(0, h * 0.78); g.lineTo(w, h * 0.78); g.moveTo(0, h * 0.62); g.lineTo(w, h * 0.62); g.stroke();
    for (let x = 6; x < w; x += 14) { g.beginPath(); g.moveTo(x, h * 0.62); g.lineTo(x, h * 0.78); g.stroke(); }
    if (dogVisible()) { // the black dog, sitting on the fire escape
      g.fillStyle = "#000"; g.beginPath(); g.ellipse(w * 0.3, h * 0.55, 16, 11, 0, 0, 7); g.fill();
      g.beginPath(); g.arc(w * 0.3 + 12, h * 0.42, 8, 0, 7); g.fill();
      g.beginPath(); g.moveTo(w * 0.3 + 8, h * 0.36); g.lineTo(w * 0.3 + 10, h * 0.28); g.lineTo(w * 0.3 + 14, h * 0.36); g.fill();
      g.fillStyle = "#e0262e"; g.fillRect(w * 0.3 + 14, h * 0.41, 2, 2);
    }
  }
  g.fillStyle = "#cfcac0"; for (let i = 0; i < 8; i++) g.fillRect(0, i * 6, w, 4); // blinds half down
  g.fillStyle = "#1b1b1f"; g.fillRect(w / 2 - 2, 0, 4, h);
}
export function drawRoom() {
  ROOMS.forEach(drawFloor);
  if (owns("rug")) { // oxblood persian rug
    poly([P(1.2, 1.7), P(2.75, 1.7), P(2.75, 3.5), P(1.2, 3.5)], "#3b1416", EDGE);
    poly([P(1.35, 1.85), P(2.6, 1.85), P(2.6, 3.35), P(1.35, 3.35)], "#4a1c1f");
    poly([P(1.7, 2.3), P(2.25, 2.3), P(2.25, 2.9), P(1.7, 2.9)], "#5e2a24");
  }
  poly([P(0, D), P(W, D), P(W, D, -0.35), P(0, D, -0.35)], "#141418"); // floor slab edges
  poly([P(W, 0), P(W, D), P(W, D, -0.35), P(W, 0, -0.35)], "#0d0d10");
  poly([P(0, 0), P(0, D), P(0, D, RH), P(0, 0, RH)], "#3d3d45");
  poly([P(0, 0), P(W, 0), P(W, 0, RH), P(0, 0, RH)], "#33333a");
  for (let i = 0.25; i < D; i += 0.5) line(P(0, i), P(0, i, RH), "rgba(255,255,255,.03)", T * 0.08);
  for (let i = 0.25; i < W; i += 0.5) line(P(i, 0), P(i, 0, RH), "rgba(255,255,255,.025)", T * 0.08);
  poly([P(0, 0), P(0, D), P(0, D, 0.12), P(0, 0, 0.12)], "#151518");
  poly([P(0, 0), P(W, 0), P(W, 0, 0.12), P(0, 0, 0.12)], "#111114");
  faceY(0.01, 1.2, 3.0, 1.0, 2.4, (w, h) => windowView(w, h, { neon: true, escape: true }));
  faceY(0.01, 7.3, 8.7, 1.3, 2.3, (w, h) => windowView(w, h));
  faceX(0.01, 6.4, 7.4, 1.2, 2.2, (w, h) => windowView(w, h));
  faceY(0.01, 9, 10, 0, 2.1, (w, h) => { // front door: mail slot, peephole, light (and sometimes a shadow) under it
    g.fillStyle = "#2a1f18"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "#1a130f"; g.lineWidth = 3; g.strokeRect(12, 14, w - 24, 70); g.strokeRect(12, 100, w - 24, 90);
    g.fillStyle = "#b8a77a"; g.fillRect(w / 2 - 14, 92, 28, 4); g.beginPath(); g.arc(w - 18, 110, 4, 0, 7); g.fill(); g.beginPath(); g.arc(w / 2, 30, 2.5, 0, 7); g.fill();
    g.fillStyle = "rgba(255,200,120,.8)"; g.fillRect(0, h - 3, w, 3);
    g.fillStyle = S.doorLocked ? "#b8a77a" : "#e0262e"; g.fillRect(w - 26, 60, 14, 5); // deadbolt: brass when locked, red when open
    if (S.doorLocked) { g.strokeStyle = "#b8a77a"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(w - 30, 50); g.quadraticCurveTo(w - 40, 62, w - 30, 74); g.stroke(); }
    const s = (Date.now() / 1000) % 40; if (s < 3) { g.fillStyle = "#000"; g.fillRect(s / 3 * w - 15, h - 3, 18, 3); }
  });
  if (owns("cork")) faceY(0.01, 5.9, 6.9, 1.1, 2.1, (w, h) => { // conspiracy corkboard
    g.fillStyle = "#5a4a38"; g.fillRect(0, 0, w, h);
    const pins = [[14, 14], [60, 10], [30, 50], [75, 55], [50, 80]];
    pins.forEach(([x, y], i) => { g.fillStyle = "#d9d3c2"; g.fillRect(x - 8, y - 6, 18, 14); g.fillStyle = "#333"; g.font = "3px serif"; g.fillText(["R2-DEBT", "LENA", "1999?", "NYSE", tr("CÃO")][i], x - 6, y + 2); });
    g.strokeStyle = "#e0262e"; g.lineWidth = 1.2; g.beginPath(); pins.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.lineTo(14, 14); g.stroke();
  });
  if (owns("clock")) faceX(0.01, 3.4, 3.9, 1.9, 2.4, (w, h) => { // wall clock with the real time
    const c = w / 2, d = nyc(); g.fillStyle = "#d8d4cc"; g.beginPath(); g.arc(c, c, 22, 0, 7); g.fill();
    g.strokeStyle = "#111"; g.lineWidth = 2;
    const hand = (a, l) => { g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.sin(a) * l, c - Math.cos(a) * l); g.stroke(); };
    hand((d.getHours() % 12 + d.getMinutes() / 60) / 12 * Math.PI * 2, 11); hand(d.getMinutes() / 60 * Math.PI * 2, 17);
  });
  faceY(0.01, 11.3, 11.9, 1.3, 2.0, (w, h) => { // calendar: today's date, in 1986
    const d = nyc(); g.fillStyle = "#e8e2d2"; g.fillRect(0, 0, w, h); g.fillStyle = "#b3141b"; g.fillRect(0, 0, w, 14);
    g.fillStyle = "#fff"; g.font = "bold 8px serif"; g.fillText(d.toLocaleDateString(LOCALE, { month: "short" }).toUpperCase() + " 1986", 4, 10);
    g.fillStyle = "#111"; g.font = "bold 30px serif"; g.fillText(d.getDate(), 10, 50);
    g.strokeStyle = "#b3141b"; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(4 + i * 11, 58); g.lineTo(12 + i * 11, 66); g.stroke(); }
  });
  faceY(0.01, 10.05, 10.32, 1.1, 1.55, (w, h) => { if (ringing) g.translate(Math.sin(Date.now() / 25) * 2, 0); g.fillStyle = "#7a1218"; g.fillRect(0, 0, w, h); g.fillStyle = "#111"; g.beginPath(); g.arc(w / 2, h / 2, 7, 0, 7); g.fill(); });
  if (S.bills.length) S.bills.slice(0, 5).forEach((b, i) => poly([P(9.2 + i * 0.1, 0.3 + i * 0.08), P(9.6 + i * 0.1, 0.3 + i * 0.08), P(9.6 + i * 0.1, 0.55 + i * 0.08), P(9.2 + i * 0.1, 0.55 + i * 0.08)], now() > b.due ? "#e8c4c4" : "#e8e2d2"));
  drawTrash();
}
export function lampShade(p) { g.fillStyle = "#1b1b1f"; g.beginPath(); g.moveTo(p[0] - T * 0.3, p[1] + T * 0.25); g.lineTo(p[0] + T * 0.3, p[1] + T * 0.25); g.lineTo(p[0] + T * 0.1, p[1]); g.lineTo(p[0] - T * 0.1, p[1]); g.fill(); line([p[0], p[1]], [p[0], p[1] - T * 1.2], "#111", 1); }
const steamPuffs = [];
export function steam(p) {
  if (Math.random() < 0.08) steamPuffs.push({ x: p[0], y: p[1], a: 0.4, r: T * 0.05 });
  for (let i = steamPuffs.length - 1; i >= 0; i--) {
    const s = steamPuffs[i]; s.y -= T * 0.01; s.r += T * 0.003; s.a -= 0.006; s.x += Math.sin(s.y) * 0.2;
    if (s.a <= 0) { steamPuffs.splice(i, 1); continue; }
    g.fillStyle = `rgba(220,220,220,${s.a})`; g.beginPath(); g.arc(s.x, s.y, s.r, 0, 7); g.fill();
  }
}

// Damped spring "pop" when a piece of furniture is upgraded.
function spring(k) {
  const t0 = bounces[k]; if (!t0) return 1;
  const t = (performance.now() - t0) / 1000;
  if (t > 1.6) { delete bounces[k]; return 1; }
  return 1 + 0.3 * Math.exp(-5 * t) * Math.sin(20 * t);
}
export function drawObj(o, bs) {
  const s = o.key && bounces[o.key] ? spring(o.key) : o.own ? spring(o.own) : 1;
  if (s !== 1) { const b = bs[0], [px, py] = P(b.x + b.w / 2, b.y + b.d / 2); g.save(); g.translate(px, py); g.scale(2 - s, s); g.translate(-px, -py); }
  bs.forEach(box); o.extra && o.extra(bs);
  if (s !== 1) g.restore();
}

