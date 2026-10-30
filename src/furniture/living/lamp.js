import { obj } from "../core.js";
import { C } from "../../engine/draw.js";
import { S } from "../../game/state.js";
import { say } from "../../characters/dex.js";

obj({ id: "lamp", boxes: () => [C(0.33, 3.83, 0.34, 0.34, 0.05, "#1b1b1f"), C(0.47, 3.97, 0.06, 0.06, 1.4, "#8a8f96", 0.05), C(0.35, 3.85, 0.3, 0.3, 0.34, "#d8c89c", 1.38, { taper: 1.6 })],
  spot: [1.0, 4.0], act: () => { S.lampOff = !S.lampOff; say(S.lampOff ? "Escuro combina comigo." : "Melhor assim."); } });
