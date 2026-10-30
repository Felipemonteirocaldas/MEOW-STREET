import { found, obj } from "../core.js";
import { B, faceX, g } from "../../engine/draw.js";

obj({ id: "shelf", boxes: () => [B(0.02, 0.3, 0.45, 1.25, 1.9, "#2f241c")], spot: [1.0, 0.9],
  extra: () => faceX(0.47, 0.3, 1.55, 0, 1.9, (w, h) => {
    const cols = ["#5a1f24", "#2f3a4a", "#6b6250", "#3a4a3f", "#8a8478", "#2a2a2e"];
    for (let s = 0; s < 4; s++) {
      g.fillStyle = "#1f1813"; g.fillRect(4, s * 46 + 40, w - 8, 6);
      for (let b = 0, x = 10; x < w - 20; b++) {
        const bw = 7 + ((b * 7 + s * 3) % 6), out = s === 2 && b === 4;
        g.fillStyle = cols[(b + s) % 6]; g.fillRect(x + (out ? -3 : 0), s * 46 + 10 + (b % 3) * 2 - (out ? 4 : 0), bw, 30 - (b % 3) * 2); x += bw + 2;
      }
    }
    g.fillStyle = "#cfc6b0"; g.font = "5px serif"; g.fillText("MOBY DICK", 52, 112);
  }),
  act: () => found("livro", "Um livro fora do lugar. Moby Dick... com um envelope dentro: 'BD-0'.") });
