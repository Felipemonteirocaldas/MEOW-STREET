import { FRIDGEB, obj } from "../core.js";
import { clamp100, faceY, g, pick, tier } from "../../engine/draw.js";
import { busy, say } from "../../characters/dex.js";
import { S } from "../../game/state.js";
import { MEAL } from "../../game/catalog.js";

obj({ id: "fridge", key: "geladeira", boxes: () => FRIDGEB(), spot: [10.8, 1.3],
  extra: bs => faceY(0.85, 10.4, 11.2, 0, bs[0].h, (w, h) => {
    g.fillStyle = "rgba(0,0,0,.2)"; g.fillRect(4, h * 0.33, w - 8, 3);
    g.fillStyle = "#77777f"; g.fillRect(w - 16, h * 0.12, 4, h * 0.15); g.fillRect(w - 16, h * 0.4, 4, h * 0.3);
    g.fillStyle = "#efe9d8"; g.fillRect(14, 70, 22, 28); g.fillStyle = "#b3141b"; g.fillRect(22, 68, 6, 4); // a note under a red magnet
    g.fillStyle = "#333"; g.font = "4px serif"; g.fillText("pague", 16, 82); g.fillText("a luz", 16, 88);
  }),
  act: () => {
    say(pick(["Pizza fria de ontem. Perfeita.", "Comida chinesa de caixinha. Clássico.", "Café requentado e um bagel."]));
    busy(3000, () => { S.needs.fome = clamp100(S.needs.fome + MEAL[tier("geladeira")]); });
  } });
