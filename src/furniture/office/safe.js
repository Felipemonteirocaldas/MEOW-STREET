import { found, obj } from "../core.js";
import { B, faceY, g } from "../../engine/draw.js";

obj({ id: "safe", boxes: () => [B(9.8, 9.1, 0.7, 0.7, 0.8, "#2a2e33")], spot: [10.15, 8.6],
  extra: () => faceY(9.8, 9.8, 10.5, 0, 0.8, (w, h) => { g.fillStyle = "#b8a77a"; g.beginPath(); g.arc(w / 2, h / 2, 12, 0, 7); g.fill(); g.fillStyle = "#111"; g.fillRect(w / 2 - 1, h / 2 - 12, 2, 8); }),
  act: () => found("safe", "Combinação: 1-9-8-6. Lá dentro, uma fita cassete marcada 'BD-0' e uma passagem só de ida.") });
