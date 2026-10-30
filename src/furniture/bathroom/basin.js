import { obj } from "../core.js";
import { C, P, T, clamp100, line } from "../../engine/draw.js";
import { busy, say } from "../../characters/dex.js";
import { S } from "../../game/state.js";

// pedestal sink: flared column, deep round basin, chrome tap with two cross knobs
obj({ id: "basin", boxes: () => [C(4.36, 6.27, 0.18, 0.18, 0.6, "#cfcac0", 0, { taper: 1.6 }), C(4.2, 6.11, 0.5, 0.5, 0.2, "#e0dcd4", 0.6, { taper: 0.55, inner: "#bdb8ae", drain: true }),
    C(4.42, 6.1, 0.06, 0.06, 0.16, "#a8aeb4", 0.8), C(4.3, 6.12, 0.06, 0.06, 0.05, "#c9ccd1", 0.8), C(4.54, 6.12, 0.06, 0.06, 0.05, "#c9ccd1", 0.8)],
  extra: () => line(P(4.45, 6.13, 0.95), P(4.45, 6.26, 0.9), "#a8aeb4", Math.max(1.5, T * 0.035)), spot: [4.45, 7.1],
  act: () => { say("Quem é esse cara no espelho?"); busy(2500, () => { S.needs.higiene = clamp100(S.needs.higiene + 15); }); } });
