import { obj, sit } from "../core.js";
import { B, clamp100, faceX, g, legs } from "../../engine/draw.js";
import { busy, say } from "../../characters/dex.js";
import { S } from "../../game/state.js";

// club armchair: wooden feet, tall tufted back, low rolled arms, a thick seat cushion
obj({ id: "armchair", boxes: () => [...legs(1.03, 5.08, 1.62, 5.68, 0.1),
    B(1.0, 5.05, 0.7, 0.7, 0.22, "#6b2228", 0.1), B(1.15, 5.17, 0.52, 0.46, 0.12, "#8a3036", 0.32),
    B(1.0, 5.05, 0.16, 0.7, 0.92, "#5a1c22", 0.1),
    B(1.12, 5.05, 0.58, 0.12, 0.42, "#5a1c22", 0.1), B(1.12, 5.63, 0.58, 0.12, 0.42, "#5a1c22", 0.1)],
  extra: () => faceX(1.16, 5.17, 5.63, 0.5, 1.02, (w, h) => { g.fillStyle = "rgba(0,0,0,.45)"; for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { g.beginPath(); g.arc(10 + i * 13 + j * 6, 12 + j * 16, 1.6, 0, 7); g.fill(); } }),
  spot: [2.1, 5.4], seat: sit(1.42, 5.4, 0.45, true),
  act: () => { say("Chandler. Sempre Chandler."); busy(8000, () => { S.needs.diversao = clamp100(S.needs.diversao + 10); }); } });
