import { dayPhase } from "../game/clock.js";
import { S, flag } from "../game/state.js";
import { D, P, T, W, g, pick, view } from "../engine/draw.js";
import { ROOMS } from "../engine/layout.js";
import { toast } from "../ui/overlays.js";
import { react } from "./reactions.js";
import { gainXp } from "../game/rpg-core.js";

// a cockroach scuttles across the floor at night (or when the place is filthy); tap it for a slipper strike
export let roach = null, splat = null, shakeUntil = 0;
export const shake = until => { shakeUntil = until; }; // other modules can't assign an imported binding
export function updateRoach(dt) {
  if (!roach && (dayPhase() !== "day" || S.trash.length >= 3) && Math.random() < dt / 90) {
    const r = pick(ROOMS); roach = { x: r.x0 + 0.5 + Math.random() * (r.x1 - r.x0 - 1), y: r.y0 + 0.5 + Math.random() * (r.y1 - r.y0 - 1), a: Math.random() * 7, v: 1.3, until: Date.now() + 9000 };
    if (Math.random() < 0.5) setTimeout(() => react("roach"), 700);
  }
  if (!roach) return;
  roach.a += (Math.random() - 0.5) * dt * 8;
  roach.x += Math.cos(roach.a) * roach.v * dt; roach.y += Math.sin(roach.a) * roach.v * dt;
  if (roach.x < 0.3 || roach.y < 0.3 || roach.x > W - 0.3 || roach.y > D - 0.3) { roach.a += Math.PI; roach.x = Math.max(0.3, Math.min(W - 0.3, roach.x)); roach.y = Math.max(0.3, Math.min(D - 0.3, roach.y)); }
  if (Date.now() > roach.until) roach = null;
}
export function drawRoach() {
  if (splat && Date.now() < splat.until) { const [x, y] = P(splat.x, splat.y, 0.01); g.fillStyle = "#3a2410"; g.beginPath(); g.ellipse(x, y, T * 0.12, T * 0.05, 0.3, 0, 7); g.fill(); g.beginPath(); g.ellipse(x + T * 0.1, y - T * 0.03, T * 0.04, T * 0.02, 0, 0, 7); g.fill(); }
  if (!roach) return;
  const [x, y] = P(roach.x, roach.y, 0.02), [x2, y2] = P(roach.x + Math.cos(roach.a), roach.y + Math.sin(roach.a), 0.02), t = Date.now() / 40;
  g.save(); g.translate(x, y); g.rotate(Math.atan2(y2 - y, x2 - x));
  g.strokeStyle = "#2a1608"; g.lineWidth = 1;
  for (const s of [-1, 1]) for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(i * T * 0.04, 0); g.lineTo(i * T * 0.05 + Math.sin(t + i) * T * 0.015, s * T * 0.06); g.stroke(); } // legs
  g.beginPath(); g.moveTo(T * 0.08, 0); g.lineTo(T * 0.16, -T * 0.04); g.moveTo(T * 0.08, 0); g.lineTo(T * 0.16, T * 0.04); g.stroke(); // antennae
  g.fillStyle = "#5a3416"; g.beginPath(); g.ellipse(0, 0, T * 0.08, T * 0.045, 0, 0, 7); g.fill();
  g.fillStyle = "#3a2410"; g.beginPath(); g.arc(T * 0.075, 0, T * 0.025, 0, 7); g.fill();
  g.restore();
}
export function hitRoach(x, y) {
  if (!roach) return false;
  const [rx, ry] = P(roach.x, roach.y, 0.02); if (Math.hypot(rx - x, ry - y) > T * 0.4 + 18 / view.z) return false;
  toast("CHINELADA!"); shakeUntil = Date.now() + 250;
  if (Math.random() < 0.35) { splat = { x: roach.x, y: roach.y, until: Date.now() + 8000 }; roach = null; react("roachKill"); flag("roach"); gainXp(10); }
  else { roach.a += Math.PI; roach.v = 2.6; react("roachMiss"); }
  return true;
}

