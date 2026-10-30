import { obj } from "../core.js";
import { B, legs } from "../../engine/draw.js";

obj({ id: "chair", boxes: () => [...legs(4.72, 1.07, 5.13, 1.38, 0.4, "#141417"), B(4.7, 1.05, 0.5, 0.4, 0.06, "#2a2a30", 0.4)] });
