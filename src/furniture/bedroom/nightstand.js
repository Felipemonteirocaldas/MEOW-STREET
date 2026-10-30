import { obj } from "../core.js";
import { B, faceY, g } from "../../engine/draw.js";
import { nyc } from "../../game/clock.js";
import { say } from "../../characters/dex.js";

obj({ id: "nightstand", boxes: () => [B(0.05, 7.55, 0.5, 0.5, 0.55, "#2a211b"), B(0.15, 7.65, 0.3, 0.2, 0.15, "#111113", 0.55)],
  extra: () => {
    faceY(7.85, 0.15, 0.45, 0.55, 0.7, (w, h) => { g.fillStyle = "#e0262e"; g.font = "bold 9px monospace"; g.fillText(nyc().toTimeString().slice(0, 5), 2, 11); });
    faceY(8.05, 0.05, 0.55, 0, 0.55, (w, h) => { g.strokeStyle = "rgba(0,0,0,.5)"; g.lineWidth = 1.5; g.strokeRect(6, 8, w - 12, 18); g.fillStyle = "#b8a77a"; g.beginPath(); g.arc(w / 2, 17, 2.5, 0, 7); g.fill(); });
  },
  spot: [1.0, 7.4], act: () => say("O despertador marca a hora certa. Eu nunca acerto ele.") });
