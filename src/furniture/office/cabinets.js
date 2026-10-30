import { CABINETS, obj } from "../core.js";
import { faceX, g } from "../../engine/draw.js";
import { say } from "../../characters/dex.js";

obj({ id: "cabinets", boxes: CABINETS, spot: [8.2, 6.5],
  extra: bs => { for (const b of bs) faceX(b.x + b.w, b.y, b.y + b.d, 0, b.h, (w, h) => { g.fillStyle = "#2a2a30"; for (let i = 0; i < 3; i++) g.fillRect(6, 10 + i * 42, w - 12, 3); }); },
  act: () => say("Arquivos. Nomes, datas, números. Quem guarda tudo isso, guarda por um motivo.") });
