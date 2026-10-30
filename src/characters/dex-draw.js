import { dex } from "./dex.js";
import { P, T, bowlBottom, g } from "../engine/draw.js";
import { S } from "../game/state.js";
import { figure } from "./figure.js";
import { SKINS } from "./look.js";

export function drawDex() {
  const d = dex, u = T / 10;
  if (d.sleeping) { d.box = null; return; }
  const [fx, fy] = P(d.x, d.y, 0), slip = Date.now() < (d.slipUntil || 0);
  g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.ellipse(fx, fy, T * 0.26, T * 0.13, 0, 0, 7); g.fill();
  if (slip) { // tip over backwards around the feet
    const k = Math.min(1, (1800 - (d.slipUntil - Date.now())) / 160);
    g.save(); g.translate(fx, fy); g.rotate(-Math.PI / 2 * k); g.translate(-fx, -fy);
  }
  const [x, y] = P(d.x, d.y, d.z), kind = d.busy && d.busy.kind;
  const bob = d.moving ? Math.abs(Math.sin(d.walk)) * u * 0.4 : kind === "dance" ? Math.abs(Math.sin(Date.now() / 150)) * u : Math.sin(Date.now() / 600) * u * 0.12;
  let base = y - bob + (kind === "clean" ? 2 * u : 0);
  const prog = d.busy && d.busy.ms ? 1 - (d.busy.until - Date.now()) / d.busy.ms : 0, now = Date.now();
  if (kind === "poo") { g.save(); g.translate(prog > 0.15 && prog < 0.75 ? Math.sin(now / 35) * u * 0.18 : 0, 0); } // straining: a little tremble
  base = figure(g, x, base, u, { look: S.look, front: d.front, sit: d.sit, swing: d.moving ? Math.sin(d.walk) : 0, nude: kind === "shower", now, bat: kind === "shower" });
  d.top = base - 10.4 * u;
  d.box = [x - 2.4 * u, base - 10.4 * u, x + 2.4 * u, y];
  if (kind === "pee" && prog > 0.12 && prog < 0.88) { // stream arcing from his waist into the bowl, then ripples
    const [ex, ey] = bowlBottom(6.56, 6.49, 0.42, 0.21), sx = x + 3.1 * u, sy = base - 1.6 * u, cx = (sx + ex) / 2, cy = Math.min(sy, ey) - T * 0.18;
    g.fillStyle = S.look.topCol; g.fillRect(x + 1.6 * u, sy - 0.5 * u, 1.5 * u, 1.1 * u); g.fillStyle = SKINS[S.look.skin]; g.fillRect(x + 2.5 * u, sy - 0.5 * u, 0.9 * u, 1.1 * u); // arm reaching forward: the stream starts at his hand, never at his back
    const at = s => [(1 - s) * (1 - s) * sx + 2 * (1 - s) * s * cx + s * s * ex, (1 - s) * (1 - s) * sy + 2 * (1 - s) * s * cy + s * s * ey];
    g.strokeStyle = "rgba(235,205,60,.75)"; g.lineWidth = Math.max(1, u * 0.35); g.beginPath();
    for (let i = 0; i <= 12; i++) { const [px, py] = at(i / 12); i ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke();
    g.fillStyle = "rgba(250,225,90,.95)";
    for (let i = 0; i < 7; i++) { const [px, py] = at(((now / 380) + i / 7) % 1); g.beginPath(); g.arc(px, py, Math.max(0.8, u * 0.28), 0, 7); g.fill(); }
    g.strokeStyle = "rgba(235,205,60,.7)"; g.lineWidth = 1;
    for (let i = 0; i < 2; i++) { const k = ((now / 450) + i / 2) % 1; g.beginPath(); g.ellipse(ex, ey, T * (0.04 + k * 0.1), T * (0.02 + k * 0.05), 0, 0, 7); g.globalAlpha = 1 - k; g.stroke(); g.globalAlpha = 1; }
  }
  if (kind === "poo") {
    g.restore();
    const [ex, ey] = bowlBottom(6.56, 6.49, 0.42, 0.21);
    if (prog > 0.1 && prog < 0.7) { // sweat drops flying off the forehead
      g.fillStyle = "#9fd4ee";
      for (let i = 0; i < 2; i++) { const k = ((now / 500) + i / 2) % 1, sd = i ? 1 : -1; g.beginPath(); g.ellipse(x + sd * (2.6 + k * 1.4) * u, base - 8 * u - k * u * 1.2 + k * k * u * 2.5, 0.35 * u, 0.55 * u, 0, 0, 7); g.fill(); }
    }
    if (prog > 0.45 && prog < 0.8) { // plop: a brown blob drops into the water, ripples spread
      const k = Math.min(1, (prog - 0.45) / 0.12), by = ey - T * 0.28 * (1 - k * k);
      g.fillStyle = "#4a2d17"; g.beginPath(); g.ellipse(ex, k < 1 ? by : ey, T * 0.045, T * 0.06, 0, 0, 7); g.fill();
      if (k >= 1) { const r = (prog - 0.57) / 0.23; g.strokeStyle = "rgba(200,225,235,.8)"; g.lineWidth = 1; g.globalAlpha = Math.max(0, 1 - r); g.beginPath(); g.ellipse(ex, ey, T * (0.05 + r * 0.12), T * (0.025 + r * 0.06), 0, 0, 7); g.stroke(); g.globalAlpha = 1; }
    }
    if (prog > 0.7) { // relief and a whiff
      g.strokeStyle = "rgba(140,170,70,.55)"; g.lineWidth = Math.max(1, u * 0.3);
      for (let i = 0; i < 3; i++) { const k = ((now / 900) + i / 3) % 1, wx = ex + (i - 1) * T * 0.1; g.globalAlpha = 1 - k; g.beginPath(); for (let j = 0; j <= 6; j++) { const yy = ey - T * 0.15 - k * T * 0.4 - j * T * 0.03; j ? g.lineTo(wx + Math.sin(j + now / 200 + i) * u * 0.5, yy) : g.moveTo(wx, yy); } g.stroke(); g.globalAlpha = 1; }
    }
  }
  if (slip) { // cartoon stars around his head
    g.restore(); d.top = fy - T * 0.6;
    const t = Date.now() / 300; g.fillStyle = "#e0c060"; g.font = `${T * 0.22}px serif`; g.textAlign = "center";
    for (let i = 0; i < 3; i++) { const a = t + i * 2.1; g.fillText("★", fx - T * 0.95 + Math.cos(a) * T * 0.22, fy - T * 0.25 + Math.sin(a) * T * 0.08); }
    g.textAlign = "left";
  }
}

