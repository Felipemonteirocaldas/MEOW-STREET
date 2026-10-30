import { RACKS, obj } from "../core.js";
import { powerCut } from "../../game/bills.js";
import { faceY, g } from "../../engine/draw.js";
import { say } from "../../characters/dex.js";
import { tr } from "../../lang.js";

// office
obj({ id: "racks", boxes: RACKS, spot: [10.4, 5.0],
  extra: bs => { if (powerCut()) return; for (const b of bs) faceY(b.y + b.d, b.x, b.x + b.w, 0, b.h, (w, h) => {
    for (let r = 0; r < 8; r++) for (let c = 0; c < 4; c++) { g.fillStyle = Math.random() < 0.3 ? "#39d98a" : Math.random() < 0.1 ? "#b3141b" : "#123020"; g.fillRect(10 + c * 12, 14 + r * 22, 5, 3); }
  }); },
  act: () => say(tr("R2-DEBT tem {n} rack(s). Ele cresce quando eu durmo.", { n: RACKS().length })) });
