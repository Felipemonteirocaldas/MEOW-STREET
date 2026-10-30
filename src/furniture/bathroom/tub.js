import { obj, sit } from "../core.js";
import { B, C, P, T, clamp100, line, poly } from "../../engine/draw.js";
import { busy, say } from "../../characters/dex.js";
import { S } from "../../game/state.js";

// bathroom
// clawfoot tub: brass ball feet, porcelain body, rolled rim, water, chrome tap at the head end
obj({ id: "tub", boxes: () => [...[[4.12, 8.03], [4.86, 8.03], [4.12, 9.71], [4.86, 9.71]].map(([x, y]) => C(x, y, 0.12, 0.12, 0.1, "#b8a77a")),
    B(4.1, 8.0, 0.9, 1.85, 0.42, "#cfcac0", 0.1), B(4.07, 7.97, 0.96, 1.91, 0.05, "#e8e4dc", 0.52), C(4.52, 7.98, 0.07, 0.07, 0.3, "#a8aeb4", 0.57)],
  spot: [5.45, 8.9], seat: sit(4.55, 8.9, 0.2, true),
  extra: () => {
    poly([P(4.16, 8.06, 0.575), P(4.96, 8.06, 0.575), P(4.96, 9.84, 0.575), P(4.16, 9.84, 0.575)], "#5f7a86", "rgba(0,0,0,.4)");
    line(P(4.3, 8.6, 0.576), P(4.7, 9.2, 0.576), "rgba(255,255,255,.18)", 1); // light on the water
    line(P(4.555, 8.0, 0.86), P(4.555, 8.22, 0.8), "#a8aeb4", Math.max(1.5, T * 0.04)); // spout
  },
  act: () => { say("Banho quente. A cidade pode esperar."); busy(6000, () => { S.needs.higiene = clamp100(S.needs.higiene + 60); }); } });
