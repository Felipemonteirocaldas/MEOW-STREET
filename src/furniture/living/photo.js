import { found, obj } from "../core.js";
import { B, bbox } from "../../engine/draw.js";

obj({ id: "photo", area: () => bbox([B(5.62, 0.31, 0.2, 0, 0.2, "", 0.75)]), minZoom: 3, walk: false,
  act: () => found("foto", "Lena. Verão de '84. Ela disse que voltava.") });
