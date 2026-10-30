import { TVB, obj, sit } from "../core.js";
import { P, faceX, g, line, tier } from "../../engine/draw.js";
import { tv, tvOn } from "../../ui/overlays.js";
import { zoomTo } from "../../engine/camera.js";

obj({ id: "tv", key: "tv", boxes: () => TVB(), spot: [2.4, 2.6], seat: sit(3.25, 2.6, 0.45),
  extra: bs => {
    const b = bs[bs.length - 1];
    faceX(b.x + b.w, b.y, b.y + b.d, b.z || 0, (b.z || 0) + b.h, (w, h) => {
      const sh = Math.min(h - 16, w * 0.6);
      g.fillStyle = tv ? `hsl(210,10%,${50 + Math.random() * 25}%)` : "#141618";
      g.beginPath(); g.roundRect(8, 8, w * 0.72, sh, 10); g.fill();
      g.fillStyle = "#b8a77a"; for (const ky of [0.25, 0.5]) { g.beginPath(); g.arc(w * 0.87, sh * ky + 10, 6, 0, 7); g.fill(); }
    });
    if (tier("tv") === 0) { line(P(0.42, 2.62, 1.25), P(0.42, 2.15, 1.95), "#77777f", 1.2); line(P(0.42, 2.62, 1.25), P(0.42, 3.1, 1.85), "#77777f", 1.2); }
    if (tier("tv") < 2) { const s = bs[0]; faceX(s.x + s.w, s.y, s.y + s.d, 0, s.h, (w, h) => { g.strokeStyle = "rgba(0,0,0,.5)"; g.lineWidth = 1.5; g.strokeRect(8, 8, w / 2 - 12, h - 16); g.strokeRect(w / 2 + 4, 8, w / 2 - 12, h - 16); }); }
  },
  act: () => { const b = TVB().at(-1); zoomTo(P(b.x + b.w, b.y + b.d / 2, (b.z || 0) + b.h / 2), tvOn); } });
