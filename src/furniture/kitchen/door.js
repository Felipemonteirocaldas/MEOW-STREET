import { obj } from "../core.js";
import { B, bbox } from "../../engine/draw.js";
import { S, save } from "../../game/state.js";
import { say } from "../../characters/dex.js";

obj({ id: "door", area: () => bbox([B(9, 0, 1, 0, 2.1, "", 0)]), spot: [9.5, 1.3],
  act: () => { S.doorLocked = !S.doorLocked; save(); say(S.doorLocked ? "Trancada. Nessa cidade, sempre." : "Destrancada. Espero não me arrepender."); } });
