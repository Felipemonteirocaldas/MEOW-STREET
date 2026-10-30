import { obj } from "../core.js";
import { B, P, T, faceY, g } from "../../engine/draw.js";
import { say } from "../../characters/dex.js";

obj({ id: "stove", boxes: () => [B(7.95, 0.05, 0.8, 0.7, 0.9, "#1e1e22")], spot: [8.35, 1.3],
  extra: () => {
    for (const [x, y] of [[8.15, 0.25], [8.55, 0.25], [8.15, 0.55], [8.55, 0.55]]) { const [sx, sy] = P(x, y, 0.91); g.strokeStyle = "#77777f"; g.lineWidth = 1; g.beginPath(); g.ellipse(sx, sy, T * 0.12, T * 0.06, 0, 0, 7); g.stroke(); }
    faceY(0.75, 7.95, 8.75, 0, 0.9, (w, h) => { // oven door with window, handle and knobs
      g.fillStyle = "#cfcac0"; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(12 + i * 18, 9, 3, 0, 7); g.fill(); }
      g.fillStyle = "#0a0a0c"; g.fillRect(12, 32, w - 24, h - 50); g.fillStyle = "#9aa0a6"; g.fillRect(14, 22, w - 28, 3);
    });
  },
  act: () => say("Não cozinho desde 1983. Longa história.") });
