import { found, obj } from "../core.js";
import { B, bbox } from "../../engine/draw.js";
import { tr } from "../../lang.js";
import { nyc } from "../../game/clock.js";

obj({ id: "clock", area: () => bbox([B(0, 3.4, 0, 0.5, 0.5, "", 1.9)]), walk: false,
  act: () => found("clock", tr("São {h} em Nova York. Em algum lugar, alguém também está acordado.", { h: nyc().toTimeString().slice(0, 5) })) });
