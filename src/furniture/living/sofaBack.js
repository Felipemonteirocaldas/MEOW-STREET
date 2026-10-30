import { obj } from "../core.js";
import { B, faceX, g } from "../../engine/draw.js";

obj({ id: "sofaBack", boxes: () => [B(3.6, 1.8, 0.25, 1.6, 0.85, "#2e211d")],
  extra: () => faceX(3.85, 1.8, 3.4, 0.1, 0.85, (w, h) => { // chesterfield tufting
    g.fillStyle = "rgba(0,0,0,.45)"; for (let i = 0; i < 7; i++) for (let j = 0; j < 3; j++) { g.beginPath(); g.arc(12 + i * 22 + (j % 2) * 11, 14 + j * 20, 1.8, 0, 7); g.fill(); }
  }) });
