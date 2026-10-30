import { DESKB, obj, pcScreen, sit } from "../core.js";
import { owns } from "../../game/catalog.js";
import { faceY, g } from "../../engine/draw.js";
import { work } from "./_shared.js";

obj({ id: "desk", key: "pc", boxes: () => DESKB(), spot: [4.95, 1.95],
  seat: () => owns("deskchair") ? sit(4.95, 1.25, 0.45) : { x: 4.95, y: 1.25, z: 0, front: false, stand: true },
  extra: () => {
    pcScreen(0.75);
    faceY(0.31, 5.62, 5.82, 0.75, 0.95, (w, h) => { g.fillStyle = "#cfc6b0"; g.fillRect(0, 0, w, h); g.fillStyle = "#555"; g.fillRect(3, 3, w - 6, h - 6); }); // Lena's photo
    faceY(0.95, 4.0, 5.8, 0, 0.75, (w, h) => { // desk drawers
      g.strokeStyle = "rgba(0,0,0,.5)"; g.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) { g.strokeRect(w - 52, 8 + i * 22, 44, 18); g.fillStyle = "#b8a77a"; g.fillRect(w - 34, 15 + i * 22, 8, 3); }
      g.strokeRect(8, 8, 60, 16);
    });
  },
  act: work });
