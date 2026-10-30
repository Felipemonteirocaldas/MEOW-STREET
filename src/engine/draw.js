import { S } from "../game/state.js";

// Noir isometric apartment (5 rooms), drawn procedurally. Pinch/drag/wheel camera; tap the floor to walk, tap things to use them.
export const cv = document.getElementById("scene"), dk = document.createElement("canvas"), dg = dk.getContext("2d");
export let g = cv.getContext("2d"); // swapped temporarily when drawing catalog thumbnails
export const W = 12, D = 10, RH = 2.6, IH = 0.4; // apartment size in tiles; outer and cut-away inner wall heights (low, so they never hide furniture)
export let T = 20, OX = 0, OY = 0, CW = 0, CH = 0, DPR = 1;
export const view = { z: 1.9, fx: 0, fy: 0 }; // world point (fx, fy) sits at the canvas centre
// HL: when set, poly() and cyl() only stroke the outline in this colour (input.js highlights hovered things with it)
export let HL = null;
export const setHL = v => { HL = v; };
export const ZMIN = 0.8, ZMAX = 8;

// catalog thumbnails borrow the drawing context; modules can't assign each other's bindings, so they go through this
export function setDrawCtx(ctx, t, ox, oy) { g = ctx; T = t; OX = ox; OY = oy; }
export function resize() {
  DPR = window.devicePixelRatio || 1;
  CW = cv.clientWidth; CH = cv.clientHeight;
  cv.width = CW * DPR; cv.height = CH * DPR; dk.width = cv.width; dk.height = cv.height;
  T = CW / (W + D + 1); OX = CW / 2 - T; OY = RH * T + T * 0.6;
}

export const P = (x, y, z = 0) => [OX + (x - y) * T, OY + (x + y) * T / 2 - z * T];
export function poly(pts, fill, stroke) {
  g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath();
  if (HL) { g.fillStyle = HL; g.fill(); return; } // highlight: a soft tint over the object's faces, no edge lines
  g.fillStyle = fill; g.fill();
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = Math.max(0.5, T * 0.025); g.lineJoin = "round"; g.stroke(); }
}
export function line(a, b, color, w = 1) {
  g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.strokeStyle = color; g.lineWidth = w; g.stroke();
}
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16), c = s => Math.min(255, Math.round(((n >> s) & 255) * f));
  return `rgb(${c(16)},${c(8)},${c(0)})`;
}
export const EDGE = "rgba(0,0,0,.6)"; // inked outlines keep every object readable in the dark
export function box(b) {
  if (b.shape === "cyl") return cyl(b);
  const { x, y, z = 0, w, d, h, c } = b;
  poly([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)], shade(c, 0.82), EDGE);
  poly([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)], shade(c, 0.64), EDGE);
  poly([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], shade(c, 1.12), EDGE);
}
// Rounded solid inscribed in the box footprint: cylinder, or a cone/bowl when taper != 1 (bottom radius = top × taper).
// inner: colour of a recessed top (water in a bowl, a hole), drawn as a smaller ellipse.
function cyl({ x, y, z = 0, w, d, h, c, taper = 1, inner, drain }) {
  const cx = x + w / 2, cy = y + d / 2, R = Math.min(w, d) / 2 * T * Math.SQRT2, rb = R * taper;
  const [bx, by] = P(cx, cy, z), [tx, ty] = P(cx, cy, z + h);
  const gr = g.createLinearGradient(tx - R, 0, tx + R, 0);
  gr.addColorStop(0, shade(c, 0.98)); gr.addColorStop(0.45, shade(c, 0.82)); gr.addColorStop(1, shade(c, 0.55));
  g.beginPath(); g.moveTo(tx - R, ty); g.lineTo(bx - rb, by); g.ellipse(bx, by, rb, rb / 2, 0, Math.PI, 0, true); g.lineTo(tx + R, ty); g.closePath();
  if (HL) { g.fillStyle = HL; g.fill(); g.beginPath(); g.ellipse(tx, ty, R, R / 2, 0, 0, 7); g.fill(); return; }
  g.fillStyle = gr; g.fill(); g.strokeStyle = EDGE; g.lineWidth = Math.max(0.5, T * 0.025); g.stroke();
  g.beginPath(); g.ellipse(tx, ty, R, R / 2, 0, 0, 7); g.fillStyle = shade(c, 1.15); g.fill(); g.stroke();
  if (inner) { // a recess seen from above: shaded inner wall, the bottom (water, coffee, drain) sits low and small inside the rim
    g.save(); g.beginPath(); g.ellipse(tx, ty, R * 0.8, R * 0.38, 0, 0, 7); g.clip();
    g.fillStyle = shade(c, 0.5); g.fill();
    g.beginPath(); g.ellipse(tx, ty - R * 0.12, R * 0.8, R * 0.38, 0, 0, 7); g.fillStyle = shade(c, 0.78); g.fill(); // lit far wall
    g.beginPath(); g.ellipse(tx, ty + R * 0.16, R * 0.48, R * 0.2, 0, 0, 7); g.fillStyle = inner; g.fill();
    if (drain) { // a small chrome drain in the porcelain bottom
      g.beginPath(); g.ellipse(tx, ty + R * 0.17, R * 0.1, R * 0.045, 0, 0, 7); g.fillStyle = "#b8bec4"; g.fill();
      g.beginPath(); g.ellipse(tx, ty + R * 0.17, R * 0.055, R * 0.024, 0, 0, 7); g.fillStyle = "#111"; g.fill();
    }
    g.restore();
    g.beginPath(); g.ellipse(tx, ty, R * 0.8, R * 0.38, 0, 0, 7); g.strokeStyle = "rgba(0,0,0,.45)"; g.lineWidth = Math.max(0.5, T * 0.02); g.stroke();
  }
}
export const bowlBottom = (cx, cy, z, r) => { const [x, y] = P(cx, cy, z); return [x, y + r * T * Math.SQRT2 * 0.16]; }; // where cyl() draws the inner bottom
export const C = (x, y, w, d, h, c, z = 0, more = {}) => ({ x, y, z, w, d, h, c, shape: "cyl", ...more });
export const depthOf = bs => { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const b of bs) { x0 = Math.min(x0, b.x); x1 = Math.max(x1, b.x + b.w); y0 = Math.min(y0, b.y); y1 = Math.max(y1, b.y + b.d); } return (x0 + x1 + y0 + y1) / 2; };
export const legs = (x0, y0, x1, y1, h, c = "#1a140f") => [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([x, y]) => B(x, y, 0.05, 0.05, h, c));
export function cabinetDoors(Y, x0, x1, h) { // two doors with knobs on a +y face
  faceY(Y, x0, x1, 0, h, (w, hh) => {
    g.strokeStyle = "rgba(0,0,0,.45)"; g.lineWidth = 1.5; g.strokeRect(6, 10, w / 2 - 9, hh - 18); g.strokeRect(w / 2 + 3, 10, w / 2 - 9, hh - 18);
    g.fillStyle = "#b8a77a"; g.beginPath(); g.arc(w / 2 - 8, hh / 2, 2.5, 0, 7); g.arc(w / 2 + 8, hh / 2, 2.5, 0, 7); g.fill();
  });
}
export function bbox(bs) {
  let r = [1e9, 1e9, -1e9, -1e9];
  for (const b of bs) for (const x of [b.x, b.x + b.w]) for (const y of [b.y, b.y + b.d]) for (const z of [b.z || 0, (b.z || 0) + b.h]) {
    const [sx, sy] = P(x, y, z); r = [Math.min(r[0], sx), Math.min(r[1], sy), Math.max(r[2], sx), Math.max(r[3], sy)];
  }
  return r;
}
// Draw in local coords (100 units = 1 tile) on a vertical plane facing the viewer.
export function faceX(X, y0, y1, z0, z1, fn) {
  const [ox, oy] = P(X, y1, z1);
  g.save(); g.transform(T / 100, -T / 200, 0, T / 100, ox, oy); fn((y1 - y0) * 100, (z1 - z0) * 100); g.restore();
}
export function faceY(Y, x0, x1, z0, z1, fn) {
  const [ox, oy] = P(x0, Y, z1);
  g.save(); g.transform(T / 100, T / 200, 0, T / 100, ox, oy); fn((x1 - x0) * 100, (z1 - z0) * 100); g.restore();
}
export const B = (x, y, w, d, h, c, z = 0) => ({ x, y, z, w, d, h, c });
export const pick = a => a[Math.floor(Math.random() * a.length)];
export const clamp100 = v => Math.min(100, Math.max(0, v));
export const tier = k => S.furn[k];

let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
export const SKY = Array.from({ length: 10 }, (_, i) => ({ x: i * 18 + rnd() * 6, w: 12 + rnd() * 10, h: 40 + rnd() * 85,
  lit: Array.from({ length: 12 }, () => [rnd(), rnd(), rnd()]) }));
export const RAIN = Array.from({ length: 40 }, () => [rnd(), rnd()]);

