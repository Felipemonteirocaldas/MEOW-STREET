import { found, obj } from "../core.js";
import { C } from "../../engine/draw.js";

obj({ id: "duck", boxes: () => [C(4.45, 8.3, 0.14, 0.14, 0.08, "#d9b42a", 0.575), C(4.49, 8.29, 0.08, 0.08, 0.07, "#e0bd34", 0.65)], block: false, minZoom: 2.5, walk: false,
  act: () => found("duck", "Quack. ...Eu falei isso em voz alta?") });
