import { found, obj } from "../core.js";
import { B, faceY, g } from "../../engine/draw.js";

obj({ id: "wardrobe", boxes: () => [B(3.0, 6.1, 0.9, 0.6, 2.0, "#2a211b")], spot: [3.45, 7.2],
  extra: () => faceY(6.7, 3.0, 3.9, 0, 2.0, (w, h) => { g.fillStyle = "#1a1410"; g.fillRect(w / 2 - 1, 8, 2, h - 16); g.fillStyle = "#b8a77a"; g.fillRect(w / 2 - 6, h / 2, 3, 8); g.fillRect(w / 2 + 3, h / 2, 3, 8); }),
  act: () => found("wardrobe", "Um sobretudo que não é meu. No bolso, um crachá: 'D. Moreno — Black Dog Systems'.") });
