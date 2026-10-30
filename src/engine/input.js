import { CH, CW, D, OX, OY, P, T, W, ZMAX, ZMIN, bbox, box, cv, depthOf, g, pick, poly, setHL, view } from "./draw.js";
import { camAnim, clampView, toWorld, zoomAt } from "./camera.js";
import { DEX_LINES, byId, dex, pickUp, say, use, walkTo } from "../characters/dex.js";
import { hitRoach, roach } from "../characters/roach.js";
import { cat, petCat } from "../characters/cat.js";
import { dogVisible } from "../world/dog.js";
import { S } from "../game/state.js";
import { TRASH, isLive } from "../furniture/catalog-map.js";
import { O } from "../furniture/core.js";
import { tv, tvPending, setTvPending } from "../ui/overlays.js";
import { CELL } from "./pathfind.js";

// ---------- input: drag to pan, pinch / wheel to zoom, tap to act ----------
const ptrs = new Map(); let pinch = null, dragged = false, down = [0, 0];
cv.addEventListener("pointerdown", e => {
  cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.offsetX, e.offsetY]);
  if (ptrs.size === 1) { dragged = false; down = [e.offsetX, e.offsetY]; }
  if (ptrs.size === 2) { const [a, b] = [...ptrs.values()], mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: view.z, w: toWorld(...mid) }; dragged = true; }
});
cv.addEventListener("pointermove", e => {
  if (!ptrs.has(e.pointerId) || camAnim) return;
  const [px, py] = ptrs.get(e.pointerId); ptrs.set(e.pointerId, [e.offsetX, e.offsetY]);
  if (ptrs.size === 2 && pinch) {
    const [a, b] = [...ptrs.values()], mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    view.z = Math.max(ZMIN, Math.min(ZMAX, pinch.z * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch.d));
    view.fx = pinch.w[0] - (mid[0] - CW / 2) / view.z; view.fy = pinch.w[1] - (mid[1] - CH / 2) / view.z; clampView();
  } else if (ptrs.size === 1) {
    if (!dragged && Math.hypot(e.offsetX - down[0], e.offsetY - down[1]) > 8) dragged = true;
    if (dragged) { view.fx -= (e.offsetX - px) / view.z; view.fy -= (e.offsetY - py) / view.z; clampView(); }
  }
});
const endPtr = e => {
  if (!ptrs.has(e.pointerId)) return;
  ptrs.delete(e.pointerId);
  if (ptrs.size < 2) pinch = null;
  if (!ptrs.size && !dragged && e.type === "pointerup") tap(e.offsetX, e.offsetY);
};
cv.addEventListener("pointerup", endPtr); cv.addEventListener("pointercancel", endPtr);
cv.addEventListener("wheel", e => { e.preventDefault(); zoomAt(e.offsetX, e.offsetY, Math.exp(-e.deltaY * 0.0015)); }, { passive: false });
document.getElementById("recenter").addEventListener("click", () => { view.z = 1.9; [view.fx, view.fy] = P(dex.x, dex.y, 0.6); clampView(); });

// footprints as the mouse cursor while it is over the floor: click and Dex walks there
const FOOT_CURSOR = `url("data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><g fill="#ffd68c" stroke="#1a1206" stroke-width="1.1" stroke-linejoin="round"><g transform="translate(11 19) rotate(-14)"><ellipse cx="0" cy="0.5" rx="3.3" ry="5.2"/><circle cx="0" cy="6.3" r="2.3"/><circle cx="-3" cy="-6.2" r="1.35"/><circle cx="-1" cy="-7.6" r="1.35"/><circle cx="1.2" cy="-7.7" r="1.3"/><circle cx="3" cy="-6.3" r="1.25"/></g><g transform="translate(22 12) rotate(-14)"><ellipse cx="0" cy="0.5" rx="3.3" ry="5.2"/><circle cx="0" cy="6.3" r="2.3"/><circle cx="-3" cy="-6.2" r="1.35"/><circle cx="-1" cy="-7.6" r="1.35"/><circle cx="1.2" cy="-7.7" r="1.3"/><circle cx="3" cy="-6.3" r="1.25"/></g></g></svg>')}") 16 16, pointer`;
// What is under this screen point? Shared by taps and by the hover/press highlight.
function pickAt(sx, sy) {
  const [x, y] = toWorld(sx, sy), pad = 6 / view.z, near = 18 / view.z; // characters are small and move: fat-finger radius
  const hit = (b, p = pad) => b && x >= b[0] - p && x <= b[2] + p && y >= b[1] - p && y <= b[3] + p;
  if (roach) { const [rx, ry] = P(roach.x, roach.y, 0.02); if (Math.hypot(rx - x, ry - y) < T * 0.4 + near) return { kind: "roach", x: rx, y: ry }; }
  if (hit(cat.box, near)) return { kind: "cat" };
  if (dogVisible() && hit(byId("window").area())) return { kind: "obj", o: byId("window") };
  for (const i of S.trash) { const [tx, ty] = TRASH[i], [px, py] = P(tx, ty, 0.1); if (Math.hypot(px - x, py - y) < T * 0.35 + pad) return { kind: "trash", i }; }
  if (hit(dex.box, near)) return { kind: "dex" };
  const cands = O.filter(o => isLive(o) && !(o.minZoom && view.z < o.minZoom)).map(o => {
    const bs = o.boxes ? o.boxes() : null, area = o.area ? o.area() : bs && bs.length ? bbox(bs) : null;
    return { o, area, depth: bs && bs.length ? depthOf(bs) : 100 };
  }).filter(c => hit(c.area)).sort((a, b) => b.depth - a.depth || (a.area[2] - a.area[0]) - (b.area[2] - b.area[0]));
  if (cands.length) return { kind: "obj", o: cands[0].o };
  const a = (x - OX) / T, b = 2 * (y - OY) / T, fx = (a + b) / 2, fy = (b - a) / 2;
  if (fx > 0 && fy > 0 && fx < W && fy < D) return { kind: "floor", fx, fy, x, y };
  return null;
}
function tap(sx, sy) {
  if (camAnim) return;
  const tg = pickAt(sx, sy); if (!tg) return;
  tapFlash = { tg, until: Date.now() + 700 };
  if (tg.kind !== "dex") { dex.idle = -15; dex.cleaning = false; }
  if (tg.kind === "roach") return hitRoach(tg.x, tg.y);
  if (tg.kind === "cat") return petCat();
  if (tg.kind === "trash") return pickUp(tg.i);
  if (tg.kind === "dex") return say(pick(DEX_LINES));
  if (tg.kind === "obj") {
    if (tg.o.id === "tv") { if (tv || tvPending) return; setTvPending(true); }
    if (use(tg.o) === false) setTvPending(false); return;
  }
  walkTo(tg.fx, tg.fy);
}

// Habbo/Sims-style feedback: whatever is under the mouse or finger gets a red outline; the floor tile lights up
export let hover = null, tapFlash = null;
cv.addEventListener("pointermove", e => { if (!ptrs.size && e.pointerType === "mouse") { hover = pickAt(e.offsetX, e.offsetY); cv.style.cursor = hover && hover.kind === "floor" ? FOOT_CURSOR : hover ? "pointer" : "grab"; } });
cv.addEventListener("pointerdown", e => { if (ptrs.size === 1) hover = pickAt(e.offsetX, e.offsetY); });
cv.addEventListener("pointerup", e => { if (e.pointerType !== "mouse") hover = null; });
cv.addEventListener("pointerleave", () => { hover = null; });
// Hover / tap feedback: a warm glow plus four corner brackets (like a camera focus), instead of a flat red box
const GOLD = "255,214,140";
function brackets(a, strong) {
  const z = view.z, pad = 4 / z, len = Math.min(14 / z, (a[2] - a[0]) / 3, (a[3] - a[1]) / 3), pulse = strong ? 0.75 + 0.25 * Math.sin(Date.now() / 70) : 0.65 + 0.15 * Math.sin(Date.now() / 260);
  const [x0, y0, x1, y1] = [a[0] - pad, a[1] - pad, a[2] + pad, a[3] + pad];
  g.save();
  g.fillStyle = `rgba(${GOLD},${strong ? 0.16 : 0.07})`; g.beginPath(); g.roundRect(x0, y0, x1 - x0, y1 - y0, 5 / z); g.fill();
  g.shadowColor = `rgba(${GOLD},.8)`; g.shadowBlur = 10; g.strokeStyle = `rgba(${GOLD},${pulse})`; g.lineWidth = 2 / z; g.lineCap = "round"; g.lineJoin = "round";
  g.beginPath();
  for (const [cx, cy, dx, dy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x1, y1, -1, -1], [x0, y1, 1, -1]]) { g.moveTo(cx + dx * len, cy); g.lineTo(cx, cy); g.lineTo(cx, cy + dy * len); }
  g.stroke(); g.restore();
}
export function drawHighlight(tg, strong) {
  const glow = strong ? 0.2 + 0.1 * Math.abs(Math.sin(Date.now() / 90)) : 0.08; // hover: barely there; tap: a short pulse
  const tint = `rgba(${GOLD},${glow})`, col = `rgba(${GOLD},${strong ? 0.9 : 0.6})`;
  const ring = (x, y, r) => { const [sx, sy] = P(x, y, 0.01); g.save(); g.shadowColor = `rgba(${GOLD},.7)`; g.shadowBlur = 8; g.strokeStyle = col; g.lineWidth = 1.6 / view.z; g.beginPath(); g.ellipse(sx, sy, T * r, T * r / 2, 0, 0, 7); g.stroke(); g.restore(); };
  if (tg.kind === "obj") {
    const bs = tg.o.boxes ? tg.o.boxes() : null;
    if (bs && bs.length) { g.globalCompositeOperation = "lighter"; setHL(tint); bs.forEach(box); setHL(null); g.globalCompositeOperation = "source-over"; brackets(bbox(bs), strong); }
    else if (tg.o.area) { const a = tg.o.area(); if (a) brackets(a, strong); }
  } else if (tg.kind === "cat") ring(cat.x, cat.y, 0.38);
  else if (tg.kind === "dex") ring(dex.x, dex.y, 0.38);
  else if (tg.kind === "trash") ring(...TRASH[tg.i], 0.3);
  else if (tg.kind === "roach" && roach) ring(roach.x, roach.y, 0.25);
  else if (tg.kind === "floor") {
    const i = Math.floor(tg.fx / CELL) * CELL, j = Math.floor(tg.fy / CELL) * CELL;
    poly([P(i, j), P(i + CELL, j), P(i + CELL, j + CELL), P(i, j + CELL)], `rgba(${GOLD},.10)`);
    g.strokeStyle = col; g.lineWidth = 1.2 / view.z; g.stroke();
  }
}

