import { obj } from "../core.js";
import { B } from "../../engine/draw.js";
import { S } from "../../game/state.js";
import { say } from "../../characters/dex.js";

obj({ id: "floppies", boxes: () => [B(8.6, 7.0, 1.0, 0.6, 0.7, "#2a211b"), ...Array.from({ length: Math.min(6, 1 + Math.floor(S.levels.software / 5)) }, (_, i) => B(8.7 + (i % 3) * 0.28, 7.1 + Math.floor(i / 3) * 0.25, 0.2, 0.2, 0.08 + (i % 2) * 0.06, "#2c2c34", 0.7))],
  spot: [9.1, 7.95], act: () => say("Disquetes. Um deles diz 'BD-0 — NÃO APAGAR'.") });
