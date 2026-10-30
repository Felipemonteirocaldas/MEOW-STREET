import { obj, sit } from "../core.js";
import { B, P, T, g, poly } from "../../engine/draw.js";
import { dex, say } from "../../characters/dex.js";
import { sleeper } from "./_shared.js";

// starter bed: an old mattress on the floor
obj({ id: "mattress", hideIf: "bed", boxes: () => [B(0.15, 8.4, 1.9, 1.0, 0.16, "#a9a292"), B(0.2, 8.52, 0.4, 0.76, 0.07, "#c4bdac", 0.16), B(0.75, 8.42, 1.1, 0.95, 0.05, "#4f4f47", 0.16)],
  spot: [2.6, 9.0], seat: sit(1.1, 8.9, 0.2),
  extra: () => {
    g.fillStyle = "rgba(0,0,0,.35)"; // quilting buttons
    for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) { const [x, y] = P(0.3 + i * 0.36, 8.55 + j * 0.35, 0.161); g.beginPath(); g.arc(x, y, Math.max(0.8, T * 0.025), 0, 7); g.fill(); }
    poly([P(1.5, 9.0, 0.22), P(1.75, 9.0, 0.22), P(1.75, 9.25, 0.22), P(1.5, 9.25, 0.22)], "rgba(60,50,30,.5)"); // old stain
    if (dex.sleeping) sleeper(P(0.4, 8.9, 0.32));
  },
  act: () => { dex.sleeping = true; say("Esse colchão já viu dias melhores.", 2500); } });
