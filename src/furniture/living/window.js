import { found, obj } from "../core.js";
import { B, P, bbox, clamp100 } from "../../engine/draw.js";
import { setDogUntil, dogVisible } from "../../world/dog.js";
import { S } from "../../game/state.js";
import { totalRate } from "../../game/production.js";
import { zoomTo } from "../../engine/camera.js";
import { openCity } from "../../city.js";

obj({ id: "window", area: () => bbox([B(1.2, 0, 1.8, 0, 1.4, "", 1)]), spot: [2.1, 0.9],
  act: () => {
    if (dogVisible()) { setDogUntil(0); S.cycles += totalRate() * 1800 + 3; found("dog", "O cachorro preto. Na escada de incêndio. Ninguém mais vê ele."); return; }
    zoomTo(P(2.1, 0, 1.7), () => { S.needs.diversao = clamp100(S.needs.diversao + 15); openCity(); });
  } });
