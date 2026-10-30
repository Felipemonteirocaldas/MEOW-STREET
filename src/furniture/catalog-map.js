import { O } from "./core.js";
import { owns } from "../game/catalog.js";
import { B, C, P, T, box, g } from "../engine/draw.js";
import { S } from "../game/state.js";

export const isLive = o => (!o.own || owns(o.own)) && !(o.hideIf && owns(o.hideIf));
export const firstLive = (...ids) => ids.map(id => O.find(o => o.id === id)).find(o => o && isLive(o));

// trash spots (index = S.trash value)
export const TRASH = [[1.8, 4.6], [3.5, 4.8], [5.2, 2.8], [6.2, 4.2], [2.0, 1.4], [8.2, 1.6], [10.8, 3.4], [7.8, 3.0], [9.4, 5.8], [10.2, 8.2], [8.4, 9.4], [1.2, 7.2], [3.3, 9.3], [5.8, 8.4]];
// one piece of trash (type depends on the spot index), at any height so it can also be drawn mid-fall
export function drawTrashAt(i, x, y, z = 0) {
  const k = (i * 7) % 4;
  if (k === 0) box(B(x - 0.2, y - 0.2, 0.4, 0.4, 0.05, "#8a7a5a", z)); // pizza box
  else if (k === 1) { const [sx, sy] = P(x, y, z + 0.06); g.fillStyle = "#cfc6b0"; g.beginPath(); g.arc(sx, sy, T * 0.09, 0, 7); g.fill(); g.beginPath(); g.arc(sx + T * 0.15, sy + T * 0.05, T * 0.07, 0, 7); g.fill(); }
  else if (k === 2) box(C(x - 0.06, y - 0.06, 0.12, 0.12, 0.16, "#d8d4cc", z, { inner: "#3a2416" })); // cold coffee
  else { // banana peel, splayed: Dex slips on these
    const [sx, sy] = P(x, y, z + 0.02); g.strokeStyle = "#d9b42a"; g.lineWidth = T * 0.06; g.lineCap = "round";
    for (const a of [-2.2, -1.2, 0.3]) { g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(sx + Math.cos(a) * T * 0.15, sy + Math.sin(a) * T * 0.04, sx + Math.cos(a + 0.4) * T * 0.22, sy + Math.sin(a + 0.4) * T * 0.1); g.stroke(); }
    g.fillStyle = "#5a3a1a"; g.beginPath(); g.arc(sx, sy, T * 0.03, 0, 7); g.fill(); g.lineCap = "butt";
  }
}
export function drawTrash() { S.trash.forEach(i => drawTrashAt(i, ...TRASH[i])); }

