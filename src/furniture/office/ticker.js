import { obj } from "../core.js";
import { B, P, T, g } from "../../engine/draw.js";
import { say } from "../../characters/dex.js";
import { openExch } from "../../ui/exchange.js";

// stock ticker: brass-capped machine under a glass dome on a pedestal, paper tape spilling into a basket
obj({ id: "ticker", boxes: () => [B(8.0, 4.3, 0.4, 0.4, 0.05, "#1f1813"), B(8.14, 4.44, 0.12, 0.12, 0.75, "#3a2c22", 0.05),
    B(8.03, 4.33, 0.34, 0.34, 0.12, "#2a2a2e", 0.8), B(8.08, 4.38, 0.24, 0.24, 0.05, "#b8a77a", 0.92), B(8.55, 4.85, 0.35, 0.35, 0.28, "#7a6a4a")],
  spot: [8.2, 5.7],
  extra: () => {
    const [dx, dy] = P(8.2, 4.5, 0.97);
    g.fillStyle = "rgba(190,210,225,.22)"; g.strokeStyle = "rgba(230,240,250,.6)"; g.lineWidth = 1;
    g.beginPath(); g.ellipse(dx, dy, T * 0.2, T * 0.34, 0, Math.PI, 0); g.fill(); g.stroke(); // glass dome
    const pts = [P(8.37, 4.5, 0.86), P(8.5, 4.62, 0.7), P(8.45, 4.75, 0.55), P(8.62, 4.85, 0.45), P(8.7, 5.0, 0.3)];
    g.strokeStyle = "#111"; g.lineWidth = T * 0.07; g.lineJoin = "round"; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.stroke();
    g.strokeStyle = "#e8e2d2"; g.lineWidth = T * 0.045; g.stroke(); // the tape
    g.fillStyle = "#e8e2d2"; for (const [x, y] of [[8.65, 4.95], [8.78, 5.05], [8.7, 5.1]]) { const [sx, sy] = P(x, y, 0.29); g.beginPath(); g.arc(sx, sy, T * 0.05, 0, 7); g.fill(); }
  },
  act: () => { say("A fita não para. BDC sobe, BDC desce."); openExch(); } });
