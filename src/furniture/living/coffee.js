import { obj } from "../core.js";
import { B, C, legs } from "../../engine/draw.js";

obj({ id: "coffee", boxes: () => [...legs(1.53, 2.23, 2.02, 2.92, 0.3), B(1.5, 2.2, 0.6, 0.8, 0.06, "#3a2c22", 0.3),
  B(1.6, 2.35, 0.32, 0.24, 0.02, "#d8d3c2", 0.36), C(1.85, 2.72, 0.1, 0.1, 0.1, "#d8d4cc", 0.36, { inner: "#3a2416" })] });
