import { CORK, found, obj } from "../core.js";
import { B, bbox } from "../../engine/draw.js";
import { S } from "../../game/state.js";
import { say } from "../../characters/dex.js";

obj({ id: "cork", area: () => bbox([B(5.9, 0, 1.0, 0, 1.0, "", 1.1)]), spot: [6.4, 0.9],
  act: () => { found("cork", CORK[0]); S.corkI = ((S.corkI || 0) + 1) % CORK.length; say(CORK[S.corkI], 6000); } });
