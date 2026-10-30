import { found, obj } from "../core.js";
import { B, bbox } from "../../engine/draw.js";

obj({ id: "calendar", area: () => bbox([B(11.3, 0, 0.6, 0, 0.7, "", 1.3)]), spot: [11.5, 1.3],
  act: () => found("calendar", "Os dias riscados de vermelho. Eu não risquei nenhum.") });
