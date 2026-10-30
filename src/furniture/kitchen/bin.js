import { obj } from "../core.js";
import { C } from "../../engine/draw.js";
import { S } from "../../game/state.js";
import { dex, say } from "../../characters/dex.js";

obj({ id: "bin", boxes: () => [C(7.2, 3.35, 0.35, 0.35, 0.48, "#5a5a62", 0, { taper: 0.85 }), C(7.18, 3.33, 0.39, 0.39, 0.04, "#6a6a72", 0.48), C(7.34, 3.49, 0.07, 0.07, 0.04, "#8a8f96", 0.52)], spot: [7.85, 3.5],
  act: () => { if (!S.trash.length) return say("Limpo. Por um milagre."); dex.cleaning = true; say("Tá bom, tá bom. Faxina."); } });
