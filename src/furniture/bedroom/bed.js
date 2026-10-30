import { BEDB, obj, sit } from "../core.js";
import { P, poly, tier } from "../../engine/draw.js";
import { dex, say } from "../../characters/dex.js";
import { sleeper } from "./_shared.js";
import { bounce } from "../../world/bounce.js";

// bedroom
obj({ id: "bed", key: "cama", boxes: () => BEDB(), spot: [2.6, 9.0], seat: () => { const b = BEDB(); return sit(1.2, b[1].y + b[1].d / 2, 0.55); },
  extra: bs => {
    const y1 = bs[1].y + bs[1].d; poly([P(1.4, y1 + 0.02), P(1.72, y1 + 0.02), P(1.72, y1 + 0.18), P(1.4, y1 + 0.18)], "#e8e2d2"); // note under the bed
    if (dex.sleeping) sleeper(P(0.38, bs[3].y + bs[3].d / 2, 0.72));
  },
  act: () => { dex.sleeping = true; say("Só cinco minutinhos...", 2500); if (tier("cama") === 2) bounce("cama"); } });
