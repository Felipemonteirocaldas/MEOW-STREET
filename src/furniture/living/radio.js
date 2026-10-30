import { obj } from "../core.js";
import { B, P, faceX, g, line } from "../../engine/draw.js";
import { S } from "../../game/state.js";
import { listen } from "./_shared.js";

// starter radio: a pocket transistor on the floor, replaced by the vitrola once bought
obj({ id: "radio", hideIf: "records", boxes: () => [B(0.15, 4.75, 0.3, 0.55, 0.32, "#2a2a30")], spot: [0.8, 4.8],
  extra: () => {
    line(P(0.3, 4.8, 0.32), P(0.3, 5.25, 0.32), "#77777f", 2); line(P(0.3, 5.25, 0.32), P(0.3, 5.7, 1.0), "#9aa0a6", 1); // handle, antenna
    faceX(0.45, 4.75, 5.3, 0, 0.32, (w, h) => {
      g.fillStyle = "#77777f"; for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { g.beginPath(); g.arc(30 + i * 6, 9 + j * 7, 1.6, 0, 7); g.fill(); }
      g.fillStyle = S.radio ? "#e0a83a" : "#3a3020"; g.fillRect(6, 8, 16, 6);
    });
  },
  act: auto => listen(auto) });
