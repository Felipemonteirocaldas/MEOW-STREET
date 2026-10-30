import { BEDB, found, obj } from "../core.js";
import { B, bbox } from "../../engine/draw.js";

obj({ id: "note", area: () => { const b = BEDB()[1], y1 = b.y + b.d; return bbox([B(1.4, y1, 0.32, 0.18, 0.02, "")]); }, minZoom: 3.5, walk: false,
  act: () => found("note", "Um bilhete debaixo da cama: 'NÃO CONFIE NO R2-DEBT. — L.'") });
