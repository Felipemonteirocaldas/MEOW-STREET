import { obj } from "../core.js";
import { B, legs } from "../../engine/draw.js";

obj({ id: "kchair", boxes: () => [...legs(10.07, 2.17, 10.43, 2.58, 0.4, "#222226"), B(10.05, 2.15, 0.45, 0.5, 0.06, "#3a3a40", 0.4)] });
