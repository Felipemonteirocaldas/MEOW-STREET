import { obj, sit } from "../core.js";
import { B, clamp100 } from "../../engine/draw.js";
import { busy, say } from "../../characters/dex.js";
import { S } from "../../game/state.js";

obj({ id: "sofa", boxes: () => [B(2.9, 1.8, 0.8, 1.6, 0.28, "#2e211d"), B(2.95, 1.84, 0.64, 0.77, 0.16, "#4a3430", 0.28), B(2.95, 2.63, 0.64, 0.77, 0.16, "#4a3430", 0.28)],
  spot: [2.4, 2.6], seat: sit(3.25, 2.6, 0.45),
  act: () => { say("Cinco minutos de silêncio. Só isso que eu peço."); busy(6000, () => { S.needs.energia = clamp100(S.needs.energia + 5); }); } });
