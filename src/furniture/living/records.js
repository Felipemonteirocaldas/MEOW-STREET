import { obj } from "../core.js";
import { B, P, T, faceX, g, line, poly } from "../../engine/draw.js";
import { S } from "../../game/state.js";
import { listen } from "./_shared.js";

// the radio lives in a 1950s radiogram console ("vitrola"): turntable on top, tube radio dial, speaker cloth in front
obj({ id: "records", boxes: () => [
    ...[[0.08, 4.38], [0.6, 4.38], [0.08, 5.48], [0.6, 5.48]].map(([x, y]) => B(x, y, 0.05, 0.05, 0.14, "#1a140f")),
    B(0.05, 4.35, 0.65, 1.2, 0.62, "#5a3a24", 0.14), B(0.1, 4.4, 0.55, 1.1, 0.03, "#3a2618", 0.76)],
  spot: [1.2, 4.7],
  extra: () => {
    poly([P(0.05, 4.35, 0.79), P(0.05, 5.55, 0.79), P(0.13, 5.55, 1.45), P(0.13, 4.35, 1.45)], "#4a2f1d", "rgba(0,0,0,.55)"); // open lid
    const [x, y] = P(0.38, 4.75, 0.8), a = S.radio ? Date.now() / 250 : 0;
    g.fillStyle = "#2a2a2e"; g.beginPath(); g.ellipse(x, y, T * 0.3, T * 0.15, 0, 0, 7); g.fill();
    g.fillStyle = "#050505"; g.beginPath(); g.ellipse(x, y, T * 0.26, T * 0.13, 0, 0, 7); g.fill();
    g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 0.5;
    for (const r of [0.2, 0.15, 0.11]) { g.beginPath(); g.ellipse(x, y, T * r, T * r / 2, 0, 0, 7); g.stroke(); }
    g.fillStyle = "#b3141b"; g.beginPath(); g.ellipse(x, y, T * 0.07, T * 0.035, 0, 0, 7); g.fill();
    line([x, y], [x + Math.cos(a) * T * 0.07, y + Math.sin(a) * T * 0.035], "#e8e2d2", 1);
    line(P(0.55, 5.1, 0.84), P(0.45, 4.86, 0.83), "#c9c2b0", Math.max(1, T * 0.03)); // tonearm
    poly([P(0.15, 5.15, 0.8), P(0.6, 5.15, 0.8), P(0.6, 5.45, 0.8), P(0.15, 5.45, 0.8)], S.radio ? "#e0a83a" : "#3a3020", "rgba(0,0,0,.5)"); // tuning dial
    faceX(0.7, 4.35, 5.55, 0.14, 0.76, (w, h) => {
      g.fillStyle = "#c9b48a"; g.fillRect(8, 8, w * 0.55, h - 16);
      g.strokeStyle = "rgba(60,40,20,.45)"; g.lineWidth = 1;
      for (let i = 12; i < w * 0.55 + 6; i += 5) { g.beginPath(); g.moveTo(i, 8); g.lineTo(i, h - 8); g.stroke(); }
      g.fillStyle = "#e0c88f"; for (const kx of [0.72, 0.88]) { g.beginPath(); g.arc(w * kx, h * 0.6, 6, 0, 7); g.fill(); }
      g.fillStyle = "#e8d9a8"; g.font = "bold 7px serif"; g.fillText("HI-FI", w * 0.72, h * 0.3);
    });
  },
  act: auto => listen(auto) });
