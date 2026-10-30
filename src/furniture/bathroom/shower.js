import { obj } from "../core.js";
import { B, C, P, T, clamp100, g, line, poly } from "../../engine/draw.js";
import { busy, dex, say } from "../../characters/dex.js";
import { S } from "../../game/state.js";

obj({ id: "shower", boxes: () => [B(6.15, 9.15, 0.8, 0.8, 0.08, "#cfcac0"), C(6.5, 9.5, 0.12, 0.12, 0.02, "#2a2a30", 0.08), C(6.86, 9.18, 0.06, 0.06, 1.7, "#a8aeb4"),
    C(6.5, 9.3, 0.2, 0.2, 0.03, "#b8bec4", 1.62, { inner: "#5a5f66" })],
  spot: [5.8, 9.5], seat: { x: 6.55, y: 9.55, z: 0.08, front: false, stand: true },
  extra: () => {
    const head = P(6.6, 9.4, 1.65); line(P(6.89, 9.21, 1.7), P(6.6, 9.4, 1.67), "#a8aeb4", 2);
    // curtain on its rod along the open side, with folds
    line(P(6.15, 9.15, 1.8), P(6.15, 9.95, 1.8), "#a8aeb4", 1.5);
    for (let i = 0; i < 6; i++) { const y0 = 9.15 + i * 0.13; poly([P(6.15, y0, 1.78), P(6.15, y0 + 0.13, 1.78), P(6.15, y0 + 0.13, 0.25), P(6.15, y0, 0.25)], i % 2 ? "rgba(150,165,175,.32)" : "rgba(180,195,205,.4)"); }
    if (dex.busy && dex.busy.kind === "shower") { g.strokeStyle = "rgba(200,215,230,.6)"; g.lineWidth = 1; for (let i = 0; i < 6; i++) { const x = head[0] + (i - 3) * T * 0.05, y = head[1] + ((Date.now() / 6 + i * 13) % (T * 1.5)); g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + T * 0.12); g.stroke(); } }
  },
  act: () => { say("Água morna, se tiver sorte."); busy(5000, () => { S.needs.higiene = clamp100(S.needs.higiene + 40); }, "shower"); } });
