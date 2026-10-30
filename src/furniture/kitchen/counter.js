import { obj } from "../core.js";
import { B, C, P, cabinetDoors, clamp100 } from "../../engine/draw.js";
import { steam } from "../../world/rooms.js";
import { busy, say } from "../../characters/dex.js";
import { S } from "../../game/state.js";

obj({ id: "counter", boxes: () => [B(11.2, 0.05, 0.75, 0.7, 0.9, "#bdb8ae"), B(11.3, 0.15, 0.3, 0.3, 0.4, "#111113", 0.9), C(11.36, 0.5, 0.16, 0.16, 0.14, "#d8d4cc", 0.9, { inner: "#3a2416" })],
  spot: [11.5, 1.3], extra: () => { steam(P(11.45, 0.3, 1.3)); cabinetDoors(0.75, 11.2, 11.95, 0.9); },
  act: () => { say("Café preto. Sem açúcar, sem perguntas."); busy(2000, () => { S.needs.energia = clamp100(S.needs.energia + 8); }); } });
