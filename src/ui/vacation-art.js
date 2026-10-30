import { S } from "../game/state.js";

// Shared pieces of the vacation scenes (Hiroshi Nagai look: flat saturated colours, banded skies with stippled edges, slim palms).
// c is the context everything draws on; vacation.js points it at the screen or at the sprite layer with setC (importers see the live value).
export let c = null;
export const setC = x => { c = x; };
const seed = n => { let s = n; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
export const R = seed(11);
export const path = (pts, close) => { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); if (close) c.closePath(); };
export const grad = (y0, y1, stops) => { const g = c.createLinearGradient(0, y0, 0, y1); stops.forEach(([o, col]) => g.addColorStop(o, col)); return g; };

// ---------- colours and time of day ----------
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
export const mix = (a, b, k) => { const A = rgb(a), B = rgb(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, "0")).join(""); };
export const rgba = (h, a) => `rgba(${rgb(h).join(",")},${a})`;
const mixV = (a, b, k) => typeof a === "string" ? mix(a, b, k) : Array.isArray(a) ? a.map((v, i) => mixV(v, b[i], k)) : typeof a === "object" ? Object.fromEntries(Object.keys(a).map(key => [key, mixV(a[key], b[key], k)])) : a + (b - a) * k;
export const DAY = { sky: ["#081a78", "#0a2090", "#0e2aa6", "#1436bc", "#1c46cc", "#2a5cd8", "#4a80e4", "#7aaeee", "#b4dcf6"], sea: ["#1a9fd8", "#5cc6f0"], night: 0, tint: ["#ffffff", 0] };
export const DUSK = { sky: ["#2a1a6a", "#43238a", "#6a2fa0", "#8f3fae", "#b24fb4", "#d26aba", "#ec88b8", "#f8a8b8", "#ffc8b8"], sea: ["#1b6fb8", "#e88aa8"], night: 0.45, tint: ["#ff5e8a", 0.16] };
export const NIGHT = { sky: ["#02061f", "#040a2e", "#060f3f", "#0a1850", "#0e2262", "#142e74", "#1c3c86", "#294f98", "#3a66a8"], sea: ["#0a3a6a", "#2a7ab8"], night: 1, tint: ["#0e1c5c", 0.5] };
const KEYS = [[0, NIGHT], [5, NIGHT], [6.6, DUSK], [8.6, DAY], [16.4, DAY], [18, DUSK], [19.9, NIGHT], [24, NIGHT]];
export function pal(hour) { // the sky follows the player's real clock (add ?vh=21 to the address to preview an hour)
  let i = 0; while (i < KEYS.length - 2 && hour >= KEYS[i + 1][0]) i++;
  const [h0, a] = KEYS[i], [h1, b] = KEYS[i + 1]; const k = Math.max(0, Math.min(1, (hour - h0) / (h1 - h0))); return mixV(a, b, k * k * (3 - 2 * k)); // eased, so the sky has no visible corners at the key hours
}
export const hourNow = () => { // real local time with seconds; ?vh=21 previews an hour, ?vh=17&vs=600 time-lapses it (600 = ten game minutes per second)
  const q = new URLSearchParams(location.search), o = q.get("vh");
  if (o) return (+o + (performance.now() / 1000) * (+q.get("vs") || 0) / 3600) % 24;
  const d = new Date(); return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
};
export const vacLook = () => ({ ...S.look, glasses: 2, hat: 4, hatCol: "#c0392b", top: 2, topCol: "#f4a340", bottom: 2, botCol: "#1f9e9a", shoes: 0, shoeCol: "#f2d38a" });
export const SK = () => ["#f2d8c6", "#e5bf9d", "#c9b2a0", "#d19a6b", "#a8714a", "#7a4b2e", "#4e2f1e"][S.look.skin];

// ---------- drawing helpers ----------
const DITH = Array.from({ length: 150 }, () => [R(), R() * R()]);
export function bandedSky(y0, y1, cols, w) {
  const bh = (y1 - y0) / cols.length;
  cols.forEach((col, i) => {
    c.fillStyle = col; c.fillRect(0, y0 + i * bh, w, bh + 1);
    if (i) for (const [fx, fy] of DITH) c.fillRect(fx * w, y0 + i * bh - 1 - fy * bh * 0.7, 2, 2); // dither dots of this band reaching up into the one above
  });
}
export const BUILD = Array.from({ length: 30 }, (_, i) => ({ x: i / 30, w: 0.03 + R() * 0.04, h: 0.12 + R() * 0.26, win: Array.from({ length: 44 }, () => [R(), R(), R() > 0.45]) }));
export function skyline(w, gy, h, scroll, k) { // the lit city of the prints: navy blocks full of yellow and orange windows
  for (const b of BUILD) {
    const bx = (((b.x * w - scroll) % w) + w) % w, bw = b.w * w * k, bh = b.h * h * 0.9 * k; c.fillStyle = "#12295c"; c.fillRect(bx, gy - bh, bw, bh);
    for (const [wx, wy, on] of b.win) if (on) { c.fillStyle = (wx * 97 | 0) % 5 ? "rgba(255,226,90,.95)" : "rgba(255,150,70,.9)"; c.fillRect(bx + 3 + wx * (bw - 8), gy - bh + 5 + wy * (bh - 12), 2.2, 2.6); }
  }
}
export function bubble(text, x, y) {
  c.font = "600 15px 'Special Elite', monospace"; const w = c.measureText(text).width + 22;
  c.fillStyle = "rgba(255,255,255,.93)"; c.beginPath(); c.roundRect(x - w / 2, y - 34, w, 30, 10); c.moveTo(x - 6, y - 5); c.lineTo(x, y + 4); c.lineTo(x + 6, y - 5); c.fill();
  c.fillStyle = "#1b1b1b"; c.textAlign = "center"; c.fillText(text, x, y - 14); c.textAlign = "left";
}
export function palm(x, y, h, lean, t) {
  const cx = x + lean + Math.sin(t * 0.8 + x * 0.01) * 4, cy = y - h;
  c.strokeStyle = "#8f3f33"; c.lineWidth = 9; c.lineCap = "round"; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + lean * 0.1, y - h * 0.55, cx, cy); c.stroke();
  c.strokeStyle = "rgba(40,10,20,.35)"; c.lineWidth = 1.5; for (let i = 1; i < 22; i++) { const k = i / 22, px = x + (cx - x) * k * k * 1.05, py = y - h * k; c.beginPath(); c.moveTo(px - 4.5, py); c.lineTo(px + 4.5, py - 2); c.stroke(); }
  const L = h * 0.3;
  for (let i = 0; i < 11; i++) { // fronds: a curved spine with leaflets on both sides, two greens
    const a = Math.PI + (i / 10) * Math.PI + Math.sin(t * 1.1 + i) * 0.03;
    const p1 = [cx + Math.cos(a) * L * 0.55, cy + Math.sin(a) * L * 0.55 - L * 0.28], p2 = [cx + Math.cos(a) * L, cy + Math.sin(a) * L * 0.5 + L * 0.38];
    const at = s => [(1 - s) * (1 - s) * cx + 2 * (1 - s) * s * p1[0] + s * s * p2[0], (1 - s) * (1 - s) * cy + 2 * (1 - s) * s * p1[1] + s * s * p2[1]];
    c.strokeStyle = "#0b4a2a"; c.lineWidth = 3; c.beginPath(); c.moveTo(cx, cy); c.quadraticCurveTo(p1[0], p1[1], p2[0], p2[1]); c.stroke();
    c.lineWidth = 2.2; c.strokeStyle = i % 2 ? "#13804a" : "#35b062";
    for (let s = 0.14; s < 1; s += 0.075) {
      const [px, py] = at(s), [qx, qy] = at(Math.min(1, s + 0.04)), tx = qx - px, ty = qy - py, n = Math.hypot(tx, ty) || 1, l = (1 - s * 0.55) * L * 0.26;
      c.beginPath(); c.moveTo(px, py); c.lineTo(px - ty / n * l + tx / n * l * 0.5, py + tx / n * l + ty / n * l * 0.5 + l * 0.3); c.moveTo(px, py); c.lineTo(px + ty / n * l + tx / n * l * 0.5, py - tx / n * l + ty / n * l * 0.5 + l * 0.3); c.stroke();
    }
  }
  c.fillStyle = "#4a2410"; for (const [dx, dy] of [[-6, 5], [5, 7]]) { c.beginPath(); c.arc(cx + dx, cy + dy, 5, 0, 7); c.fill(); }
}
export function bush(x, y, r) { // pink bougainvillea: a flat dark-green mass with pink and white blossoms
  c.fillStyle = "#1f6b3a"; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  for (let i = 0; i < 70; i++) { const a = i * 2.4, d = Math.sqrt((i + 1) / 70) * r * 0.95; c.fillStyle = i % 3 ? "#e0388a" : i % 5 ? "#f58fc0" : "#fff"; c.beginPath(); c.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.9 - r * 0.1, 3.2 + (i % 3), 0, 7); c.fill(); }
}
export function lounger(x, y, k) {
  c.save(); c.translate(x, y); c.scale(k, k); c.lineCap = "round";
  c.strokeStyle = "#7a7a80"; c.lineWidth = 5; c.beginPath(); c.moveTo(-85, -42); c.lineTo(-92, 0); c.moveTo(-20, -30); c.lineTo(-22, 0); c.moveTo(85, -12); c.lineTo(90, 0); c.stroke();
  c.lineWidth = 22; c.strokeStyle = "#f4f1e8"; c.beginPath(); c.moveTo(-95, -52); c.lineTo(95, -14); c.stroke();
  c.lineCap = "butt"; c.strokeStyle = "#17a8d6"; c.setLineDash([16, 16]); c.beginPath(); c.moveTo(-95, -52); c.lineTo(95, -14); c.stroke(); c.setLineDash([]);
  c.restore();
}
export function glass(x, y, k, t) { // tropical drink: tulip glass, straw, orange slice, paper umbrella
  c.save(); c.translate(x, y); c.scale(k, k);
  const lq = c.createLinearGradient(0, -34, 0, -8); lq.addColorStop(0, "#ffb03a"); lq.addColorStop(1, "#e8456b");
  c.fillStyle = "rgba(255,255,255,.35)"; path([[-11, -36], [11, -36], [5, -8], [-5, -8]], 1); c.fill(); c.fillStyle = lq; path([[-10, -30], [10, -30], [5, -8], [-5, -8]], 1); c.fill();
  c.strokeStyle = "rgba(255,255,255,.7)"; c.lineWidth = 1.5; path([[-11, -36], [11, -36], [5, -8], [-5, -8]], 1); c.stroke(); c.fillStyle = "rgba(255,255,255,.7)"; c.fillRect(-1, -8, 2, 9); c.fillRect(-7, 0, 14, 2);
  c.strokeStyle = "#e0262e"; c.lineWidth = 3; c.beginPath(); c.moveTo(3, -26); c.lineTo(8, -52); c.stroke();
  c.fillStyle = "#ffa21f"; c.beginPath(); c.arc(-10, -36, 6, Math.PI, 0); c.fill();
  c.strokeStyle = "#444"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-3, -34); c.lineTo(-6, -54); c.stroke(); c.fillStyle = "#ff5fa2"; path([[-14, -52], [2, -52], [-6, -60]], 1); c.fill();
  c.fillStyle = "rgba(255,255,255,.6)"; for (let i = 0; i < 3; i++) { const p = (t * 0.7 + i / 3) % 1; c.beginPath(); c.arc(Math.sin(p * 9 + i) * 3, -10 - p * 18, 1.6, 0, 7); c.fill(); }
  c.restore();
}
function coconut(x, y, k) {
  c.save(); c.translate(x, y); c.scale(k, k);
  c.fillStyle = "#7a4a2a"; c.beginPath(); c.arc(0, -10, 11, 0, 7); c.fill(); c.fillStyle = "#f3ead2"; c.beginPath(); c.ellipse(0, -18, 7, 3, 0, 0, 7); c.fill();
  c.strokeStyle = "#e0262e"; c.lineWidth = 2.5; c.beginPath(); c.moveTo(2, -18); c.lineTo(-8, -42); c.stroke(); c.strokeStyle = "#fff"; c.setLineDash([3, 3]); c.stroke(); c.setLineDash([]);
  c.fillStyle = "#3fc1c9"; path([[-2, -28], [10, -28], [4, -37]], 1); c.fill();
  c.restore();
}
export function cat(x, y, k, t, pet = 0) { // the black cat in shades and a straw hat, sipping a coconut; pet (0-1) makes it purr
  const sip = Math.max(Math.max(0, Math.sin(t * 0.8)) ** 8, pet * 0.7), bob = sip * 4 + pet * Math.sin(t * 30) * 0.8, ear = Math.sin(t * 0.5) > 0.96 ? 3 : 0;
  c.save(); c.translate(x, y); c.scale(k, k);
  c.fillStyle = "#0b0b0d"; c.lineCap = "round"; c.lineWidth = 8; c.strokeStyle = "#0b0b0d"; c.beginPath(); c.moveTo(16, -8); c.quadraticCurveTo(48, -6 + Math.sin(t * 2) * 6, 42 + Math.sin(t * 2) * 8, -54); c.stroke(); // tail
  c.beginPath(); c.ellipse(0, -26, 20, 28, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(10, -8, 15, 9, 0, 0, 7); c.fill();
  c.lineWidth = 7; c.beginPath(); c.moveTo(-8, -26); c.lineTo(-12, 0); c.moveTo(-3, -34); c.lineTo(-24, -42 - sip * 6); c.stroke();
  coconut(-30, -34 - sip * 6, 0.9);
  const hy = -62 + bob, hx = -12 - sip * 3; c.fillStyle = "#0b0b0d"; c.beginPath(); c.arc(hx, hy, 15, 0, 7); c.fill();
  c.beginPath(); c.moveTo(hx - 14, hy - 5); c.lineTo(hx - 12, hy - 26 - ear); c.lineTo(hx - 2, hy - 12); c.moveTo(hx + 14, hy - 5); c.lineTo(hx + 12, hy - 26); c.lineTo(hx + 2, hy - 12); c.fill();
  c.fillStyle = "#1a1a22"; c.strokeStyle = "#c9a227"; c.lineWidth = 1.5; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(hx + s * 7, hy + 1, 7, 5.5, 0, 0, 7); c.fill(); c.stroke(); }
  c.beginPath(); c.moveTo(hx - 1, hy + 1); c.lineTo(hx + 1, hy + 1); c.moveTo(hx - 14, hy); c.lineTo(hx - 18, hy - 3); c.moveTo(hx + 14, hy); c.lineTo(hx + 18, hy - 3); c.stroke();
  c.fillStyle = "rgba(255,255,255,.55)"; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(hx + s * 7 - 2, hy - 1, 2, 1.2, -0.5, 0, 7); c.fill(); }
  c.fillStyle = "#e58fb4"; path([[hx - 2, hy + 8], [hx + 2, hy + 8], [hx, hy + 11]], 1); c.fill(); c.strokeStyle = "rgba(220,220,230,.6)"; c.lineWidth = 1; c.beginPath(); for (const s of [-1, 1]) for (const d of [-2, 2]) { c.moveTo(hx + s * 4, hy + 10); c.lineTo(hx + s * 16, hy + 10 + d * 2); } c.stroke();
  c.fillStyle = "#d9b45a"; c.beginPath(); c.ellipse(hx, hy - 17, 23, 5, 0, 0, 7); c.fill(); c.beginPath(); c.roundRect(hx - 10, hy - 30, 20, 14, [8, 8, 1, 1]); c.fill(); c.fillStyle = "#c0392b"; c.fillRect(hx - 10, hy - 21, 20, 4);
  c.fillStyle = "#e8b923"; c.beginPath(); c.arc(hx + 2, hy + 17, 3, 0, 7); c.fill(); // collar tag
  c.restore();
}
export function plane(x, y, t, lights) {
  c.save(); c.translate(x, y); c.rotate(-0.05 + Math.sin(t * 2) * 0.02);
  const tr0 = c.createLinearGradient(-420, 0, -60, 0); tr0.addColorStop(0, "rgba(255,255,255,0)"); tr0.addColorStop(1, "rgba(255,255,255,.7)"); c.fillStyle = tr0; c.fillRect(-420, -3, 360, 6);
  c.fillStyle = "#e9ecef"; c.beginPath(); c.roundRect(-70, -15, 150, 30, [14, 22, 22, 14]); c.fill();
  c.fillStyle = "#c0392b"; path([[-62, -14], [-85, -52], [-58, -52], [-30, -14]], 1); c.fill(); c.fillStyle = "#adb5bd"; path([[-10, 6], [-52, 46], [-30, 46], [28, 6]], 1); c.fill(); path([[-10, -4], [-40, -38], [-22, -38], [26, -4]], 1); c.fill();
  c.fillStyle = "#4dabf7"; for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(-40 + i * 11, -4, 3, 0, 7); c.fill(); } c.beginPath(); c.roundRect(58, -10, 16, 8, 4); c.fill();
  c.fillStyle = "#868e96"; c.beginPath(); c.ellipse(-4, 30, 14, 6, 0, 0, 7); c.fill();
  if (lights && Math.sin(t * 5) > 0) { c.fillStyle = "#ff3b3b"; c.beginPath(); c.arc(-45, 44, 3, 0, 7); c.fill(); }
  c.restore();
}
