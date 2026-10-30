import { CRATESB, obj, pcScreen, sit } from "../core.js";
import { faceX, faceY, g } from "../../engine/draw.js";
import { tr } from "../../lang.js";
import { work } from "./_shared.js";

// starter workstation: R2-DEBT on a plank over two crates; Dex sits on the floor
obj({ id: "crates", key: "pc", hideIf: "desk", boxes: () => CRATESB(), spot: [4.95, 1.95], seat: sit(4.95, 1.25, 0.12),
  extra: () => {
    for (const x0 of [4.1, 5.1]) { // slatted fruit crates
      const slats = (w, h) => { g.fillStyle = "rgba(0,0,0,.5)"; g.fillRect(0, h * 0.32, w, 3); g.fillRect(0, h * 0.66, w, 3); g.fillStyle = "rgba(255,240,200,.25)"; g.font = "bold 8px serif"; g.fillText(tr("FRUTAS"), 6, h * 0.55); };
      faceY(0.8, x0, x0 + 0.6, 0, 0.5, slats); faceX(x0 + 0.6, 0.1, 0.8, 0, 0.5, slats);
    }
    pcScreen(0.56);
  }, act: work });
