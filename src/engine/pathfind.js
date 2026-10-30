import { D, W } from "./draw.js";
import { O } from "../furniture/core.js";
import { isLive } from "../furniture/catalog-map.js";
import { WALLS } from "./layout.js";

// ---------- pathfinding on a half-tile grid ----------
export const CELL = 0.5, GW = W / CELL, GD = D / CELL;
function blockedGrid() {
  const bl = new Uint8Array(GW * GD); rects = [];
  for (const o of O) if (o.boxes && o.block !== false && isLive(o)) {
    const bs = o.boxes(); if (!bs.length || Math.min(...bs.map(b => b.z || 0)) > 0.05) continue;
    // the whole footprint blocks, so legs don't leave walk-through gaps under tables and chairs
    const b = { x: Math.min(...bs.map(q => q.x)), y: Math.min(...bs.map(q => q.y)) };
    b.w = Math.max(...bs.map(q => q.x + q.w)) - b.x; b.d = Math.max(...bs.map(q => q.y + q.d)) - b.y;
    rects.push(b);
    for (let j = 0; j < GD; j++) for (let i = 0; i < GW; i++) {
      const cx = (i + 0.5) * CELL, cy = (j + 0.5) * CELL;
      if (cx > b.x - 0.12 && cx < b.x + b.w + 0.12 && cy > b.y - 0.12 && cy < b.y + b.d + 0.12) bl[j * GW + i] = 1;
    }
  }
  return bl;
}
// body radius: a straight segment must keep this far from every footprint, not just avoid blocked cells (cells are 0.5 wide, so a "free" cell can still graze furniture)
const BODY = 0.17; let rects = [];
const hitsFurniture = (x, y) => rects.some(b => x > b.x - BODY && x < b.x + b.w + BODY && y > b.y - BODY && y < b.y + b.d + BODY);
function crossesWall(ax, ay, bx, by) {
  for (const [axis, at, s0, s1] of WALLS) {
    const [p, q, r, s] = axis === "x" ? [ax, bx, ay, by] : [ay, by, ax, bx];
    if ((p - at) * (q - at) < 0) { const v = r + (at - p) / (q - p) * (s - r); if (v > s0 - 0.12 && v < s1 + 0.12) return true; }
  }
  return false;
}
export function findPath(sx, sy, tx, ty) {
  const bl = blockedGrid(), idx = (i, j) => j * GW + i;
  // standing inside a footprint (shower stall, a seat): that furniture stops blocking so he can walk back out
  const m = 0.12, inside = b => sx > b.x - m && sx < b.x + b.w + m && sy > b.y - m && sy < b.y + b.d + m;
  for (const b of rects.filter(inside)) for (let j = 0; j < GD; j++) for (let i = 0; i < GW; i++) {
    const cx = (i + 0.5) * CELL, cy = (j + 0.5) * CELL;
    if (cx > b.x - m && cx < b.x + b.w + m && cy > b.y - m && cy < b.y + b.d + m) bl[idx(i, j)] = 0;
  }
  rects = rects.filter(b => !inside(b));
  const ok = (i, j) => i >= 0 && j >= 0 && i < GW && j < GD && !bl[idx(i, j)];
  const ci = v => Math.max(0, Math.min(GW - 1, Math.floor(v / CELL))), cj = v => Math.max(0, Math.min(GD - 1, Math.floor(v / CELL)));
  const start = idx(ci(sx), cj(sy));
  let gi = ci(tx), gj = cj(ty);
  if (!ok(gi, gj)) { // nearest free cell to the target
    let best = null;
    for (let r = 1; r < 5 && !best; r++) for (let j = gj - r; j <= gj + r; j++) for (let i = gi - r; i <= gi + r; i++)
      if (ok(i, j) && !crossesWall((i + 0.5) * CELL, (j + 0.5) * CELL, tx, ty) && (!best || Math.hypot(i - gi, j - gj) < Math.hypot(best[0] - gi, best[1] - gj))) best = [i, j];
    if (!best) return null; [gi, gj] = best;
  }
  const goal = idx(gi, gj), cost = new Float32Array(GW * GD).fill(Infinity), prev = new Int32Array(GW * GD).fill(-1), done = new Uint8Array(GW * GD);
  const h = n => Math.hypot(n % GW - gi, Math.floor(n / GW) - gj);
  cost[start] = 0; const open = [start];
  while (open.length) {
    let bi = 0; for (let k = 1; k < open.length; k++) if (cost[open[k]] + h(open[k]) < cost[open[bi]] + h(open[bi])) bi = k;
    const cur = open.splice(bi, 1)[0];
    if (cur === goal) break; if (done[cur]) continue; done[cur] = 1;
    const i = cur % GW, j = Math.floor(cur / GW);
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue;
      const ni = i + di, nj = j + dj;
      if (!ok(ni, nj) || (di && dj && (!ok(i + di, j) || !ok(i, j + dj)))) continue;
      if (crossesWall((i + 0.5) * CELL, (j + 0.5) * CELL, (ni + 0.5) * CELL, (nj + 0.5) * CELL)) continue;
      const n = idx(ni, nj), c = cost[cur] + (di && dj ? 1.414 : 1);
      if (c < cost[n]) { cost[n] = c; prev[n] = cur; open.push(n); }
    }
  }
  if (goal !== start && prev[goal] === -1) return null;
  const pts = [];
  for (let n = goal; n !== start && n !== -1; n = prev[n]) pts.unshift([(n % GW + 0.5) * CELL, (Math.floor(n / GW) + 0.5) * CELL]);
  // string-pulling: skip waypoints while the straight line stays clear
  const clear = (a, b) => {
    if (crossesWall(a[0], a[1], b[0], b[1])) return false;
    const steps = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.2);
    for (let s = 1; s < steps; s++) { const x = a[0] + (b[0] - a[0]) * s / steps, y = a[1] + (b[1] - a[1]) * s / steps; if (!ok(Math.floor(x / CELL), Math.floor(y / CELL)) || hitsFurniture(x, y)) return false; }
    return true;
  };
  const out = []; let from = [sx, sy];
  for (let k = 0; k < pts.length; k++) if (k === pts.length - 1 || !clear(from, pts[k + 1])) { out.push(pts[k]); from = pts[k]; }
  return out;
}

