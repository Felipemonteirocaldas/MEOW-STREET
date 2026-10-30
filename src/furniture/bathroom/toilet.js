import { obj, sit } from "../core.js";
import { B, C, P, T, bowlBottom, g, pick } from "../../engine/draw.js";
import { flush, flushUntil, wc } from "./_shared.js";
import { S, save } from "../../game/state.js";
import { busy, say } from "../../characters/dex.js";

// toilet: wall pipe, cistern with lid and chrome lever, round pedestal, bowl with water and a seat ring
obj({ id: "toilet", boxes: () => [C(6.53, 6.13, 0.06, 0.06, 0.42, "#9aa0a6"), B(6.33, 6.12, 0.5, 0.18, 0.42, "#d8d4cc", 0.42), B(6.31, 6.1, 0.54, 0.22, 0.05, "#e8e4dc", 0.84),
    B(6.84, 6.17, 0.05, 0.08, 0.03, "#a8aeb4", 0.74),
    C(6.44, 6.37, 0.24, 0.24, 0.22, "#cfcac0", 0, { taper: 1.3 }), C(6.35, 6.28, 0.42, 0.42, 0.2, "#e0dcd4", 0.22, { taper: 0.6, inner: "#8fa6b0" })],
  extra: () => {
    const [x, y] = P(6.56, 6.49, 0.42), R = 0.21 * T * Math.SQRT2, t = Date.now() / 1000;
    g.strokeStyle = "#f2efe8"; g.lineWidth = Math.max(1, T * 0.05); g.beginPath(); g.ellipse(x, y, R * 0.88, R * 0.43, 0, 0, 7); g.stroke(); // seat ring
    const [bx, by] = bowlBottom(6.56, 6.49, 0.42, 0.21);
    if (Date.now() < flushUntil) { // flush: water swirling down
      g.strokeStyle = "rgba(230,240,245,.8)"; g.lineWidth = 1;
      for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(bx, by, R * (0.45 - i * 0.12), R * (0.2 - i * 0.05), 0, t * 8 + i, t * 8 + i + 4); g.stroke(); }
    }
    if (!S.poo) return;
    // the comic bit: it floats, it bobs, it smells, it has fans
    const py = by + Math.sin(t * 2) * T * 0.012, u = T * 0.05;
    for (const [dx, dy, r, c] of [[0, 0, 1.6, "#4a2e14"], [0.2, -0.7, 1.15, "#5a3a1a"], [0.35, -1.25, 0.7, "#6a4622"]]) {
      g.fillStyle = c; g.beginPath(); g.ellipse(bx + dx * u, py + dy * u, r * u, r * u * 0.6, 0, 0, 7); g.fill();
    }
    g.fillStyle = "rgba(255,255,255,.35)"; g.beginPath(); g.arc(bx - 0.5 * u, py - 0.3 * u, 0.3 * u, 0, 7); g.fill();
    g.strokeStyle = "rgba(150,170,70,.55)"; g.lineWidth = Math.max(1, T * 0.03);
    for (let i = 0; i < 3; i++) { // stink lines
      const sx = x + (i - 1) * R * 0.5, k = (t * 0.6 + i * 0.33) % 1;
      g.globalAlpha = 1 - k; g.beginPath();
      for (let s = 0; s <= 8; s++) { const yy = y - k * T * 0.6 - s * T * 0.05, xx = sx + Math.sin(s * 1.2 + t * 3) * T * 0.04; s ? g.lineTo(xx, yy) : g.moveTo(xx, yy); }
      g.stroke(); g.globalAlpha = 1;
    }
    g.fillStyle = "#050505";
    for (let i = 0; i < 2; i++) { const a = t * (3 + i) + i * 2; g.beginPath(); g.arc(x + Math.cos(a) * R * 0.9, y - T * 0.35 + Math.sin(a * 1.7) * T * 0.15, Math.max(1, T * 0.025), 0, 7); g.fill(); } // flies
  },
  // two visits: number one (stands facing the bowl, back to us) or number two (sits); decided when he picks his spot
  spot: [6.55, 7.3], seat: () => S.poo ? null : (wc.pee = Math.random() < 0.5) ? { x: 6.56, y: 6.9, z: 0, front: false, stand: true } : sit(6.56, 6.52, 0.42, true),
  act: auto => {
    if (S.poo) return flush("Adeus, velho amigo.");
    wc.last = Date.now();
    if (wc.pee) {
      say(pick(["Café demais, de novo.", "Uma pausa estratégica.", "Nova York não espera. Minha bexiga também não."]));
      return busy(3600, () => { if (Math.random() < 0.7) setTimeout(() => flush("Descarga. Civilização."), 400); else say("Depois eu dou descarga. Talvez."); }, "pee");
    }
    say(pick(["Privacidade, por favor.", "Ninguém precisa saber disso.", "O jornal de ontem tem utilidade, afinal.", "R2-DEBT, não olha."]));
    busy(5200, () => {
      S.poo = true; save(); // he forgets the flush half the time; tap the toilet to flush
      if (Math.random() < 0.5) say(pick(["Esqueci a descarga. De novo.", "Depois eu dou descarga. Talvez."]));
      else setTimeout(() => flush("Descarga. Civilização."), 600);
    }, "poo");
  } });
