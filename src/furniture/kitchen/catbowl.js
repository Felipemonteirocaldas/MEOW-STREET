import { obj } from "../core.js";
import { C, pick } from "../../engine/draw.js";
import { S, save } from "../../game/state.js";
import { busy, say } from "../../characters/dex.js";
import { CAT_FOOD } from "../../characters/cat.js";

obj({ id: "catbowl", boxes: () => [C(11.5, 3.4, 0.25, 0.25, 0.07, "#7a1218", 0, { taper: 0.8, inner: S.cat.bowl > 0 ? "#7a4a20" : "#2a0a0c" })], block: false, spot: [11.1, 3.2],
  act: () => {
    if (S.cat.bowl > 0) return say("A tigela ainda tem ração. Ele é que é exigente.");
    if (S.usd < CAT_FOOD) return say("Sem dinheiro nem pra ração. Desculpa, Sombra.");
    busy(1500, () => { S.usd -= CAT_FOOD; S.cat.bowl = 100; save(); say(pick(["Ração servida. Peixe de lata, o melhor da casa.", "Sombra! Comida!"])); });
  } });
