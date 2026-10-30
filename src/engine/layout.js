import { B, IH } from "./draw.js";

// ---------- layout ----------
export const ROOMS = [
  { name: "Sala", x0: 0, y0: 0, x1: 7, y1: 6, floor: "wood" },
  { name: "Cozinha", x0: 7, y0: 0, x1: 12, y1: 4, floor: "checker" },
  { name: "Escritório", x0: 7, y0: 4, x1: 12, y1: 10, floor: "dark" },
  { name: "Quarto", x0: 0, y0: 6, x1: 4, y1: 10, floor: "carpet" },
  { name: "Banheiro", x0: 4, y0: 6, x1: 7, y1: 10, floor: "tile" },
];
// Solid stretches of inner wall: [axis, at, from, to]; gaps between them are doorways.
export const WALLS = [
  ["x", 7, 0, 1], ["x", 7, 3, 4], ["x", 7, 5, 10], ["x", 4, 6, 10],
  ["y", 4, 7, 9], ["y", 4, 10, 12], ["y", 6, 0, 2], ["y", 6, 3, 5], ["y", 6, 6, 7],
];
export const WALL_PIECES = [];
for (const [ax, at, a, b] of WALLS) for (let s = a; s < b; s++) {
  const e = Math.min(b, s + 1);
  WALL_PIECES.push(ax === "x" ? B(at - 0.06, s, 0.12, e - s, IH, "#4b4b54") : B(s, at - 0.06, e - s, 0.12, IH, "#4b4b54"));
}

