import { obj } from "../core.js";
import { B, P, bbox, clamp100 } from "../../engine/draw.js";
import { zoomTo } from "../../engine/camera.js";
import { S } from "../../game/state.js";
import { openCity } from "../../city.js";

obj({ id: "bedwin", area: () => bbox([B(0, 6.4, 0, 1.0, 1.0, "", 1.2)]), spot: [1.0, 6.9],
  act: () => zoomTo(P(0, 6.9, 1.7), () => { S.needs.diversao = clamp100(S.needs.diversao + 10); openCity(); }) });
