import { obj } from "../core.js";
import { B, C, faceY, g } from "../../engine/draw.js";

obj({ id: "radiator", boxes: () => [B(1.5, 0.02, 1.2, 0.2, 0.55, "#5d5d63"), C(1.55, 0.05, 0.08, 0.08, 0.08, "#8a8f96", 0.55)], // + valve
  extra: () => faceY(0.22, 1.5, 2.7, 0.03, 0.55, (w, h) => { g.fillStyle = "rgba(0,0,0,.45)"; for (let x = 6; x < w - 4; x += 8) g.fillRect(x, 4, 3, h - 8); }) });
