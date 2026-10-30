import { obj } from "../core.js";
import { C, P, clamp100, line, poly } from "../../engine/draw.js";
import { lampShade } from "../../world/rooms.js";
import { openPaper } from "../../ui/newspaper.js";
import { busy } from "../../characters/dex.js";
import { S } from "../../game/state.js";

obj({ id: "table", boxes: () => [C(9.22, 2.17, 0.46, 0.46, 0.04, "#1f1813"), C(9.38, 2.33, 0.14, 0.14, 0.66, "#2a211b", 0.04, { taper: 1.4 }), C(9.05, 2.0, 0.8, 0.8, 0.06, "#3a2c22", 0.7)], // round bistro table spot: [10.9, 2.4], seat: sit(10.28, 2.4, 0.45),
  extra: () => { poly([P(9.15, 2.15, 0.77), P(9.55, 2.15, 0.77), P(9.55, 2.55, 0.77), P(9.15, 2.55, 0.77)], "#d9d3c2");
    for (let i = 0; i < 3; i++) line(P(9.2, 2.22 + i * 0.1, 0.77), P(9.5, 2.22 + i * 0.1, 0.77), "rgba(0,0,0,.45)");
    lampShade(P(9.45, 2.4, 2.3)); },
  act: auto => { if (!auto) openPaper(); busy(5000, () => { S.needs.diversao = clamp100(S.needs.diversao + 12); }); } });
