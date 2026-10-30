import { obj } from "../core.js";
import { B, cabinetDoors, clamp100 } from "../../engine/draw.js";
import { busy, say } from "../../characters/dex.js";
import { S } from "../../game/state.js";

// kitchen
obj({ id: "sink", boxes: () => [B(7.15, 0.05, 0.8, 0.7, 0.9, "#bdb8ae"), B(7.35, 0.15, 0.4, 0.4, 0.02, "#7d838b", 0.9), B(7.52, 0.08, 0.06, 0.06, 0.25, "#9aa0a6", 0.9)],
  extra: () => cabinetDoors(0.75, 7.15, 7.95, 0.9), spot: [7.55, 1.3],
  act: () => { say("Água fria. Acorda qualquer um."); busy(2500, () => { S.needs.higiene = clamp100(S.needs.higiene + 15); }); } });
