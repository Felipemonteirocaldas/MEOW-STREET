import { S, flag, gameOver, now, save } from "../game/state.js";
import { figure } from "../characters/figure.js";
import { gainXp } from "../game/rpg-core.js";
import { say } from "../characters/dex.js";
import { tr } from "../lang.js";
import { vacAudio, sfx } from "../audio/vacation.js";
import { R, SK, bandedSky, bubble, bush, c, cat, glass, grad, hourNow, lounger, mix, pal, palm, path, plane, rgba, setC, vacLook } from "./vacation-art.js";
import { SCENES, TRIP_LEN, cabin, door, jet, taxi } from "./vacation-trip.js";

// Férias em Pernambuco (Porto de Galinhas): while S.vacation is set the whole game is paused (production, bills, needs, the apartment, the case's 7-day limit).
// A four-cut trip (door, taxi, plane window, jet) leads to a beach that follows the player's real clock and reacts to taps. Coming back shifts every clock by the time away.
// Look: Hiroshi Nagai (flat colour, banded skies, slim palms, pink decks, pool sparkles). Drawing helpers are in vacation-art.js, the trip in vacation-trip.js, sound in audio/vacation.js.
const el = document.createElement("div"); el.id = "vac"; el.hidden = true;
el.innerHTML = `<canvas></canvas><div class="vac-cap"></div><div class="vac-time"></div><div class="vac-fact"></div><button class="vac-snd" aria-label="${tr("Som")}"></button><button class="vac-skip" hidden>${tr("Pular")}</button><button class="vac-back" hidden>${tr("Voltar ao apartamento")}</button>`;
document.body.append(el);
const cv = el.querySelector("canvas"), main = cv.getContext("2d"), cap = el.querySelector(".vac-cap"), clock = el.querySelector(".vac-time"), fact = el.querySelector(".vac-fact"), skip = el.querySelector(".vac-skip"), back = el.querySelector(".vac-back"), snd = el.querySelector(".vac-snd");
const off = document.createElement("canvas"), octx = off.getContext("2d"); // sprite layer: tinted by the time of day, then composited over the ground
let phase = "beach", t0 = 0, beachT0 = 0, last = 0, sceneKey = "", view = { s: 0, pool: 0 };
const FISH = Array.from({ length: 9 }, (_, i) => [14 + R() * 18, R(), R(), ["#ffd23a", "#ff9a2e", "#ff5fa2", "#ffe86a"][i % 4]]);
const FACTS = ["Porto de Galinhas: piscinas naturais de recifes de coral, a poucos minutos de jangada.", "Olinda: centro histórico Patrimônio Mundial da UNESCO.", "Frevo: Patrimônio Cultural Imaterial da Humanidade.", "Fernando de Noronha: Patrimônio Mundial Natural da UNESCO.", "Recife: a cidade das pontes, cortada por rios e cheia de história.", "Tapioca com coco, caldinho de feijão e água de coco gelada: sabores de Pernambuco."];
const STARS = Array.from({ length: 90 }, () => [R(), R() * 0.9, R() * 6]), FAR = Array.from({ length: 60 }, (_, i) => [i / 60, 0.012 + R() * 0.02, 0.02 + R() * 0.05, R(), R()]);
const LINES = { dex: ["Oxe, nem lembro o que é boleto.", "R2-DEBT? Quem?", "Mais uma água de coco, visse?", "Isso sim é home office."], cat: ["Miau, visse?", "*sorve*", "Sombra aprova. Arretado!", "Quero tapioca."] };
const fx = { cat: 0, glass: 0, dex: 0, crabOff: 0, crabDir: 1, crabUntil: 0, hearts: [], ripples: [], say: null, gullUntil: 0 }, gulls = [0, 1, 2].map(i => ({ x: i * 330, sp: 26 + i * 9 })), HIT = [];
const paintSnd = () => { snd.textContent = vacAudio.on() ? "♪" : "×"; snd.classList.toggle("off", !vacAudio.on()); };

// ---------- start / end ----------
export function startVacation() { S.vacation = { since: now() }; save(); open("trip"); }
function open(mode) {
  phase = mode; t0 = performance.now(); beachT0 = t0; last = t0; sceneKey = ""; el.hidden = false; skip.hidden = mode !== "trip"; back.hidden = mode === "trip"; paintSnd();
  document.getElementById("menu").hidden = true; vacAudio.start(); requestAnimationFrame(frame);
}
function endVacation() {
  const ms = now() - S.vacation.since;
  for (const k of ["lastBill", "lastTrash"]) S[k] += ms;
  S.last = now(); S.poker.next += ms; S.bills.forEach(b => { b.due += ms; }); (S.deals || []).forEach(d => { d.at += ms; });
  for (const o of [S.rpg.cd, S.rpg.until]) for (const k in o) o[k] += ms;
  if (S.rpg.seventh) S.rpg.seventh += ms; if (S.bonus) S.bonus.until += ms;
  for (const k in S.needs) S.needs[k] = Math.max(S.needs[k], 90); // rested
  S.cat.hunger = Math.max(S.cat.hunger, 80); S.cat.aff = Math.min(100, S.cat.aff + 5);
  delete S.vacation; flag("vacation"); gainXp(30); save(); el.hidden = true; vacAudio.stop();
  say(tr("Pernambuco foi massa demais. Agora, de volta ao 4B."), 6000);
}
function toBeach() { phase = "beach"; beachT0 = performance.now(); skip.hidden = true; back.hidden = false; }
skip.addEventListener("click", toBeach);
back.addEventListener("click", endVacation);
snd.addEventListener("click", e => { e.stopPropagation(); vacAudio.toggle(); paintSnd(); });
el.addEventListener("pointerdown", () => vacAudio.resume()); // a reload while away starts silent until the first tap
if (S.vacation && !gameOver) setTimeout(() => open("beach"), 0); // reloaded while away (after every module has loaded: the audio reads OPTS from menu.js)

// ---------- taps on the beach ----------
const pick = a => a[Math.floor(Math.random() * a.length)];
const talk = (who, text, sec) => { fx.say = { who, text: tr(text), until: performance.now() / 1000 + sec }; };
cv.addEventListener("pointerdown", e => {
  if (phase !== "beach" || !view.s) return;
  const x = e.clientX / view.s, y = e.clientY / view.s, hit = HIT.find(([, hx, hy, r]) => Math.hypot(x - hx, y - hy) < r), id = hit ? hit[0] : y > view.pool ? "pool" : "", T = performance.now() / 1000;
  if (id === "cat") { fx.cat = T + 1.8; for (let i = 0; i < 5; i++) fx.hearts.push({ x: hit[1] + (i - 2) * 14, y: hit[2] - 40, t0: T + i * 0.12 }); talk("cat", pick(["Purrr…", "Miau (traduzindo: mais coco)", "*ronrona*"]), 2.6); sfx("purr"); }
  else if (id === "glass") { fx.glass = T + 1.2; talk("dex", "Saúde!", 2); sfx("clink"); }
  else if (id === "dex") { fx.dex = T + 1.6; talk("dex", pick(["Oi! Hoje não tem R2-DEBT.", "Massa! Não me acorde pra falar de boleto.", "A vida é bela. Só que de sombra."]), 2.6); }
  else if (id === "crab") { fx.crabUntil = T + 1.3; fx.crabDir = x < hit[1] ? 1 : -1; sfx("click"); }
  else if (id === "gull") { fx.gullUntil = T + 2.5; sfx("gull"); }
  else if (id === "pool") { fx.ripples.push({ x, y, t0: T }); sfx("splash"); }
});

// ---------- the beach ----------
function beach(t, w, h, hour, dt) {
  const P = pal(hour), night = P.night, hz = h * 0.4, seaH = h * 0.045, lawnTop = hz + seaH + 6, lawnBot = h * 0.58, gy = h * 0.75, poolTop = h * 0.835, cx = w / 2;
  HIT.length = 0; view.pool = poolTop + 10;
  bandedSky(0, hz, P.sky, w);
  if (night > 0.15) { c.fillStyle = "#fff"; for (const [x, y, ph] of STARS) { c.globalAlpha = Math.min(1, night * 1.3) * (0.45 + 0.55 * Math.sin(t * 1.6 + ph)); c.fillRect(x * w, y * hz, 2, 2); } c.globalAlpha = 1; } // stars
  if (night > 0.35) { const mx = w * 0.8, my = hz * 0.32, g = c.createRadialGradient(mx, my, 10, mx, my, 120); g.addColorStop(0, `rgba(255,246,200,${0.4 * night})`); g.addColorStop(1, "rgba(255,246,200,0)"); c.fillStyle = g; c.fillRect(mx - 130, my - 130, 260, 260); c.globalAlpha = Math.min(1, night * 1.2); c.fillStyle = "#f6f0d4"; c.beginPath(); c.arc(mx, my, 24, 0, 7); c.fill(); c.fillStyle = P.sky[Math.min(8, Math.floor(my / hz * 9))]; c.beginPath(); c.arc(mx + 9, my - 5, 21, 0, 7); c.fill(); c.globalAlpha = 1; } // crescent moon
  c.fillStyle = mix(P.sea[0], P.sky[8], 0.35); for (const [fx0, fw, fh] of FAR) c.fillRect(fx0 * w, hz - fh * h * 0.6, fw * w, fh * h * 0.6 + 1); // the far skyline of the bay
  if (night > 0.25) { c.fillStyle = "#ffe27a"; for (const [fx0, fw, fh, a, b] of FAR) { c.globalAlpha = Math.min(1, night) * (0.6 + 0.4 * Math.sin(t * 2 + a * 9)); c.fillRect(fx0 * w + fw * w * a, hz - fh * h * 0.6 * b - 2, 2, 2.4); } c.globalAlpha = 1; }
  c.fillStyle = P.sea[0]; c.fillRect(0, hz, w, seaH); c.fillStyle = P.sea[1]; c.fillRect(0, hz, w, 3);
  c.fillStyle = "#fff"; for (let x = 0; x < w; x += 22) { c.globalAlpha = (0.5 + 0.3 * Math.sin(t * 1.5 + x)) * (1 - night * 0.6); c.fillRect(x, hz + seaH * 0.62, 12, 2); } c.globalAlpha = 1; // the reef line, where the waves break
  for (let i = 0; i < 3; i++) { const sx = ((t * 3 + i * w / 3) % (w + 60)) - 30, sy = hz + seaH * 0.4; c.globalAlpha = 1 - night * 0.7; c.fillStyle = "#7a4a22"; c.fillRect(sx - 7, sy, 14, 3); c.fillStyle = ["#e8452c", "#fff", "#f2c200"][i]; path([[sx, sy - 14], [sx, sy], [sx + 9, sy]], 1); c.fill(); c.globalAlpha = 1; } // jangadas drifting by
  c.fillStyle = "#fff"; for (let i = 0; i < 40; i++) { const x = (i * 97.3 + t * 6 * (1 + i % 3)) % w, y = hz + 6 + (i * 13.7) % (seaH - 8); c.globalAlpha = (0.35 + 0.35 * Math.sin(t * 2 + i)) * (1 - night * 0.7); c.fillRect(x, y, 7, 1.6); } c.globalAlpha = 1;
  if (night > 0.25) { c.fillStyle = "#ffe27a"; for (let i = 0; i < 26; i++) { c.globalAlpha = night * 0.5 * (0.5 + 0.5 * Math.sin(t * 2.4 + i)); c.fillRect(((i * 211) % 1000) / 1000 * w, hz + 3 + (i % 5) * seaH / 6, 2, 5); } c.globalAlpha = 1; }
  // ground: drawn in day colours, then the time-of-day tint goes over it
  c.fillStyle = "#1f6b3a"; c.beginPath(); c.moveTo(0, lawnTop); for (let x = 0; x <= w; x += 14) c.lineTo(x, lawnTop - 8 - 7 * Math.abs(Math.sin(x * 0.07 + 1))); c.lineTo(w, lawnTop); c.fill();
  c.fillStyle = grad(lawnTop, lawnBot, [[0, "#4cb84e"], [1, "#2f8f45"]]); c.fillRect(0, lawnTop - 2, w, lawnBot - lawnTop + 2);
  const px = w * 0.58, py = lawnTop + 26; c.fillStyle = "#fff"; c.beginPath(); c.moveTo(px - 24, py); c.quadraticCurveTo(px, py - 22, px + 24, py); c.fill(); c.fillRect(px - 1, py, 2, 22); c.fillStyle = "#e8eef4"; c.fillRect(px - 12, py + 14, 24, 3); c.fillRect(px - 11, py + 17, 2, 8); c.fillRect(px + 9, py + 17, 2, 8); // a tiny parasol and table, far away
  c.fillStyle = "#ecd29a"; c.fillRect(0, lawnBot, w, h - lawnBot); c.fillStyle = "#f7e6bd"; c.fillRect(0, lawnBot, w, 6); c.fillStyle = "rgba(255,255,255,.12)"; for (let y = lawnBot + 30; y < poolTop; y += 26) c.fillRect(0, y, w, 1.5);
  c.fillStyle = "rgba(120,80,40,.2)"; for (const [x0, k] of [[w * 0.1, 1], [w * 0.19, 0.8], [w * 0.93, -1]]) { c.beginPath(); c.moveTo(x0 - 5, lawnBot + 12); c.lineTo(x0 + 5, lawnBot + 12); c.lineTo(x0 + 190 * k + 5, poolTop - 10); c.lineTo(x0 + 190 * k - 5, poolTop - 10); c.fill(); } // long diagonal shadows
  c.fillStyle = "#f7e6bd"; c.fillRect(0, poolTop - 6, w, 12); // wet sand line
  c.fillStyle = grad(poolTop, h, [[0, "#5fe3d2"], [0.5, "#22bfd0"], [1, "#0e8ccc"]]); c.beginPath(); c.moveTo(0, poolTop); for (let x = 0; x <= w; x += 12) c.lineTo(x, poolTop + 3 * Math.sin(x * 0.03 + t * 1.2)); c.lineTo(w, h); c.lineTo(0, h); c.fill(); // the natural pool: shallow turquoise water
  for (const [rx, ry, rr] of [[0.2, 0.9, 38], [0.46, 0.93, 52], [0.7, 0.88, 34], [0.9, 0.95, 44]]) { c.fillStyle = "#5b4a42"; c.beginPath(); c.ellipse(w * rx, h * ry, rr, rr * 0.38, 0, 0, 7); c.fill(); c.fillStyle = "#3f7a4a"; c.beginPath(); c.ellipse(w * rx - rr * 0.1, h * ry - rr * 0.14, rr * 0.7, rr * 0.2, 0, 0, 7); c.fill(); c.strokeStyle = "rgba(255,255,255,.7)"; c.lineWidth = 2; c.beginPath(); c.ellipse(w * rx, h * ry + 2, rr * 1.15, rr * 0.5, 0, 0.1, Math.PI - 0.1); c.stroke(); } // reef rocks with a rim of foam
  FISH.forEach(([sp, ph, yy, col], i) => { const fxp = ((t * sp + ph * w) % (w + 80)) - 40, fyp = poolTop + 26 + yy * (h - poolTop - 50) + Math.sin(t * 2 + i) * 4; c.fillStyle = col; c.beginPath(); c.ellipse(fxp, fyp, 9, 5, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(fxp - 8, fyp); c.lineTo(fxp - 15, fyp - 5 + Math.sin(t * 9 + i) * 2); c.lineTo(fxp - 15, fyp + 5 + Math.sin(t * 9 + i) * 2); c.fill(); if (i % 2) { c.fillStyle = "rgba(0,0,0,.65)"; c.fillRect(fxp - 2, fyp - 5, 2, 10); c.fillRect(fxp + 3, fyp - 4, 2, 8); } }); // little fish: sargentinhos and others
  c.strokeStyle = "rgba(255,255,255,.55)"; c.lineWidth = 1.6; for (let i = 0; i < 46; i++) { const fx0 = (i * 0.6180339) % 1, fy = (i * 0.3819) % 1, x = w * (0.04 + fx0 * 0.92), y = poolTop + 12 + fy * (h - poolTop - 14), a = 0.35 + 0.65 * Math.max(0, Math.sin(t * 2.2 + i * 1.7)), r = 2 + 3 * a; c.globalAlpha = a; c.beginPath(); c.moveTo(x - r, y); c.lineTo(x + r, y); c.moveTo(x, y - r * 0.7); c.lineTo(x, y + r * 0.7); c.stroke(); } c.globalAlpha = 1;
  const [tc, ta] = P.tint; if (ta > 0.01) { c.fillStyle = rgba(tc, ta); c.fillRect(0, lawnTop - 14, w, h); }
  // sprites on their own layer, tinted by source-atop so only their pixels change
  const tf = main.getTransform(); setC(octx); octx.save(); octx.setTransform(1, 0, 0, 1, 0, 0); octx.clearRect(0, 0, off.width, off.height); octx.restore(); octx.setTransform(tf);
  palm(w * 0.1, lawnBot + 4, h * 0.6, 62, t); palm(w * 0.19, lawnBot - 4, h * 0.5, 38, t + 1.5); palm(w * 0.93, lawnBot - 6, h * 0.52, -46, t + 3); bush(w * 0.86, lawnBot - 40, 78);
  c.save(); c.translate(w * 0.8, poolTop + 4); c.fillStyle = "#7a4a22"; c.beginPath(); c.moveTo(-72, -6); c.quadraticCurveTo(0, 28, 72, -8); c.lineTo(62, -14); c.quadraticCurveTo(0, 8, -64, -14); c.closePath(); c.fill(); c.strokeStyle = "#5a3a1a"; c.lineWidth = 4; c.beginPath(); c.moveTo(0, -10); c.lineTo(0, -128); c.stroke(); c.fillStyle = "#fff"; path([[3, -124], [3, -18], [70, -22]], 1); c.fill(); c.fillStyle = "#e8452c"; path([[3, -90], [3, -62], [38, -66], [30, -84]], 1); c.fill(); c.fillStyle = "#1e5bd8"; path([[3, -50], [3, -26], [52, -30], [44, -44]], 1); c.fill(); c.fillStyle = "#f2c200"; c.fillRect(-70, -9, 8, 4); c.restore(); // a jangada, the sail raft of the coast
  c.strokeStyle = "#e8d29a"; c.lineWidth = 2; for (let i = 0; i < 26; i++) { const k = i / 25, bx = w * 0.06 + k * w * 0.88, sag = Math.sin(k * Math.PI) * 38, by = h * 0.1 + sag + Math.sin(t * 1.5 + i) * 1.5; if (i) { c.beginPath(); c.moveTo(w * 0.06 + (i - 1) / 25 * w * 0.88, h * 0.1 + Math.sin((i - 1) / 25 * Math.PI) * 38); c.lineTo(bx, by); c.stroke(); } c.fillStyle = ["#e8452c", "#f2c200", "#1ec8c8", "#ff5fa2", "#6ad04a", "#3a6aff"][i % 6]; path([[bx - 7, by], [bx + 7, by], [bx, by + 16]], 1); c.fill(); } // São João bunting, bandeirinhas
  const dxc = cx - 70, cxc = cx + 200, ox = dxc + 115, oy = gy - 30, th = -Math.PI / 2 + 0.2 + Math.sin(t * 1.4) * 0.008, u = 11, doze = night > 0.6;
  c.fillStyle = "rgba(120,80,40,.26)"; c.beginPath(); c.ellipse(cx + 70, gy + 6, 320, 16, 0, 0, 7); c.fill();
  c.strokeStyle = "#e8eef4"; c.lineWidth = 6; c.beginPath(); c.moveTo(cx + 70, gy - 250); c.lineTo(cx + 70, gy + 6); c.stroke();
  for (const tx of [w * 0.24, w * 0.76]) { c.strokeStyle = "#6a4a2a"; c.lineWidth = 5; c.beginPath(); c.moveTo(tx, gy + 14); c.lineTo(tx, gy - 62); c.stroke(); if (night > 0.2) { const fl = 0.8 + 0.2 * Math.sin(t * 9 + tx); c.fillStyle = "#ffb23a"; c.beginPath(); c.ellipse(tx, gy - 72, 6 * fl, 11 * fl, 0, 0, 7); c.fill(); c.fillStyle = "#fff1a0"; c.beginPath(); c.ellipse(tx, gy - 70, 3 * fl, 6 * fl, 0, 0, 7); c.fill(); } } // tiki torches
  lounger(dxc, gy, 1.15);
  c.save(); c.translate(ox, oy); c.rotate(th); figure(c, 0, 0, u, { look: vacLook(), front: true, sit: false, swing: 0, nude: false, now: 0, bat: false, shades: true }); c.restore();
  const sh = [2.4 * u, -9.3 * u], hx = ox + sh[0] * Math.cos(th) - sh[1] * Math.sin(th), hy = oy + sh[0] * Math.sin(th) + sh[1] * Math.cos(th), headX = ox + 11.4 * u * Math.sin(th), headY = oy - 11.4 * u * Math.cos(th);
  const sleepy = clamp((night - 0.45) / 0.25), sipLift = (1 - sleepy) * Math.max(0, Math.sin(t * 0.8)) ** 8 * 8, lift = sipLift + (t < fx.glass ? 14 : 0) + (t < fx.dex ? 10 + 8 * Math.sin(t * 12) : 0);
  c.strokeStyle = SK(); c.lineWidth = 9; c.lineCap = "round"; c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx + 4, hy - 36 - lift); c.stroke(); glass(hx + 4, hy - 30 - lift, 1.1, t);
  lounger(cxc, gy, 0.62); cat(cxc - 4, gy - 34, 1.05, t, t < fx.cat ? 1 : 0);
  for (let i = 0; i < 10; i++) { const e0 = [cx + 70 + (i / 5 - 1) * 270, gy - 195 + Math.abs(i / 5 - 1) * 22], e1 = [cx + 70 + ((i + 1) / 5 - 1) * 270, gy - 195 + Math.abs((i + 1) / 5 - 1) * 22]; c.fillStyle = ["#e8452c", "#f2c200", "#1ec8c8", "#ff5fa2", "#6ad04a"][i % 5]; path([[cx + 70, gy - 252], e0, e1], 1); c.fill(); }
  if (t < fx.crabUntil) fx.crabOff += fx.crabDir * dt * 260; else fx.crabOff *= Math.max(0, 1 - dt * 0.8);
  const cr = Math.max(w * 0.1, Math.min(w * 0.9, w * 0.5 + Math.sin(t * 0.3) * w * 0.3 + fx.crabOff)), cyy = gy + (poolTop - gy) * 0.55; c.fillStyle = "#e8452c"; c.beginPath(); c.ellipse(cr, cyy, 11, 7, 0, 0, 7); c.fill(); for (const s of [-1, 1]) { c.beginPath(); c.arc(cr + s * 15, cyy - 6 + Math.sin(t * 6) * 2, 5, 0, 7); c.fill(); c.strokeStyle = "#e8452c"; c.lineWidth = 2; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(cr + s * 8, cyy + i * 2); c.lineTo(cr + s * 17, cyy + 6 + i * 2 + Math.sin(t * 8 + i) * 2); c.stroke(); } }
  if (night < 0.7) { c.strokeStyle = "#fff"; c.lineWidth = 2.5; gulls.forEach((g, i) => { g.x = (g.x + dt * g.sp * (t < fx.gullUntil ? 3.5 : 1)) % (w + 160); const x = g.x - 80, y = hz * 0.5 + i * 34 + Math.sin(t * 1.6 + i) * 8, f = Math.sin(t * 7 + i) * 6; c.beginPath(); c.moveTo(x - 14, y - f); c.quadraticCurveTo(x - 6, y - 8, x, y); c.quadraticCurveTo(x + 6, y - 8, x + 14, y - f); c.stroke(); HIT.push(["gull", x, y, 26]); }); }
  const jx = ((t * 14) % (w + 200)) - 100; c.save(); c.translate(jx, hz * 0.4); c.scale(0.3, 0.3); plane(0, 0, t, true); c.restore(); // a tiny jet crossing the sky, as in the prints
  HIT.unshift(["crab", cr, cyy, 26], ["glass", hx + 4, hy - 56 - lift, 30], ["cat", cxc - 10, gy - 55, 48], ["dex", dxc + 10, gy - 60, 105]);
  setC(main); main.save(); main.setTransform(1, 0, 0, 1, 0, 0); octx.setTransform(1, 0, 0, 1, 0, 0);
  if (ta > 0.01) { octx.globalCompositeOperation = "source-atop"; octx.fillStyle = rgba(tc, ta); octx.fillRect(0, 0, off.width, off.height); octx.globalCompositeOperation = "source-over"; }
  main.drawImage(off, 0, 0); main.restore(); main.setTransform(tf);
  if (night > 0.2) { // glow: pool lights, the string of bulbs around the parasol, a warm pool of light on the deck
    main.globalCompositeOperation = "lighter";
    for (const tx of [w * 0.24, w * 0.76]) { const fl = 0.8 + 0.2 * Math.sin(t * 9 + tx), g = c.createRadialGradient(tx, gy - 30, 2, tx, gy - 30, 130); g.addColorStop(0, `rgba(255,170,70,${0.45 * night * fl})`); g.addColorStop(1, "rgba(255,140,60,0)"); c.fillStyle = g; c.fillRect(tx - 130, gy - 160, 260, 260); } // torch light
    const wg = c.createRadialGradient(cx + 70, gy - 70, 10, cx + 70, gy - 70, 240); wg.addColorStop(0, `rgba(255,170,90,${0.2 * night})`); wg.addColorStop(1, "rgba(255,170,90,0)"); c.fillStyle = wg; c.fillRect(cx - 180, gy - 310, 500, 400);
    for (let i = 0; i <= 10; i++) { const bx = cx + 70 + (i / 5 - 1) * 270, by = gy - 195 + Math.abs(i / 5 - 1) * 22, g = c.createRadialGradient(bx, by, 1, bx, by, 24); g.addColorStop(0, `rgba(255,214,130,${0.8 * night})`); g.addColorStop(1, "rgba(255,200,100,0)"); c.fillStyle = g; c.fillRect(bx - 24, by - 24, 48, 48); }
    main.globalCompositeOperation = "source-over";
  }
  for (const r of fx.ripples) { const a = t - r.t0; c.strokeStyle = `rgba(255,255,255,${Math.max(0, 0.9 - a)})`; c.lineWidth = 2; for (const k of [0, 0.25]) { c.beginPath(); c.ellipse(r.x, r.y, Math.max(1, (a - k) * 70), Math.max(1, (a - k) * 22), 0, 0, 7); c.stroke(); } } fx.ripples = fx.ripples.filter(r => t - r.t0 < 1.2);
  c.font = "700 22px serif"; for (const hh of fx.hearts) { const a = t - hh.t0; if (a < 0) continue; c.globalAlpha = Math.max(0, 1 - a / 1.6); c.fillStyle = "#ff4d8d"; c.fillText("♥", hh.x + Math.sin(a * 4) * 6, hh.y - a * 60); } c.globalAlpha = 1; fx.hearts = fx.hearts.filter(hh => t - hh.t0 < 1.6);
  if (doze) { c.fillStyle = "rgba(255,255,255,.85)"; c.font = "700 22px 'Special Elite', monospace"; for (let i = 0; i < 3; i++) { const k = (t * 0.45 + i / 3) % 1; c.globalAlpha = 1 - k; c.fillText("z", headX - 20 - k * 14 + i * 8, headY - 50 - k * 60); } c.globalAlpha = 1; }
  const k = Math.floor(t / 7), on = t % 7 < 4.2, who = k % 2 ? "cat" : "dex";
  if (fx.say && t < fx.say.until) { if (fx.say.who === "dex") bubble(fx.say.text, headX + 30, headY - 130); else bubble(fx.say.text, cxc - 20, gy - 190); }
  else if (on && !(doze && who === "dex")) { const msg = tr(LINES[who][Math.floor(k / 2) % LINES[who].length]); if (who === "dex") bubble(msg, headX + 30, headY - 130); else bubble(msg, cxc - 20, gy - 190); }
  c.fillStyle = "rgba(255,255,255,.07)"; for (let i = 0; i < 260; i++) c.fillRect(((i * 7919) % 1000) / 1000 * w, ((i * 104729) % 1000) / 1000 * h, 1.4, 1.4); // fine print grain
  return night;
}

// ---------- frame ----------
const ease = k => k * k * (3 - 2 * k), clamp = k => Math.max(0, Math.min(1, k));
function frame(ts) {
  if (el.hidden) return;
  const W = innerWidth, H = innerHeight, dpr = devicePixelRatio || 1, pw = Math.round(W * dpr), ph = Math.round(H * dpr);
  if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
  if (off.width !== pw || off.height !== ph) { off.width = pw; off.height = ph; }
  const s = Math.min(H / 600, W / 760), w = W / s, h = H / s, dt = Math.min(0.1, (ts - last) / 1000), wall = performance.now(); last = ts; view.s = s;
  setC(main); main.setTransform(dpr * s, 0, 0, dpr * s, 0, 0); main.globalAlpha = 1;
  let key = "beach", bars = 0, black = 0, night = 0;
  if (phase === "trip") {
    const t = (wall - t0) / 1000;
    if (t >= TRIP_LEN) toBeach();
    else {
      let i = 0, acc = 0; while (i < SCENES.length - 1 && t >= acc + SCENES[i][1]) { acc += SCENES[i][1]; i++; }
      const [name, dur] = SCENES[i], lt = t - acc, P = pal(hourNow()); key = name;
      main.save();
      if (name === "door") { const z = 1 + 0.12 * ease(lt / dur); main.translate(w * 0.5, h * 0.62); main.scale(z, z); main.translate(-w * 0.5, -h * 0.62); } // slow push-in
      else if (name === "taxi") main.translate(Math.sin(lt * 13) * 1.2, Math.cos(lt * 17) * 1.0); // handheld
      else if (name === "jet") { const z = 1.07 - 0.07 * ease(lt / dur); main.translate(w * 0.5, h * 0.5); main.scale(z, z); main.translate(-w * 0.5, -h * 0.5); }
      ({ door, taxi, cabin, jet }[name])(lt, w, h, P);
      main.restore();
      bars = h * 0.085 * clamp(Math.min(t / 0.6, (TRIP_LEN - t) / 0.6)); black = Math.max(1 - lt / 0.35, (lt - (dur - 0.35)) / 0.35, 0);
      if (t < 0.5) black = Math.max(black, 1 - t / 0.5);
    }
  }
  if (phase === "beach") {
    const bt = (wall - beachT0) / 1000, e = ease(clamp(bt / 1.2)), z = 1 + 0.07 * (1 - e);
    main.save(); main.translate(w / 2, h / 2); main.scale(z, z); main.translate(-w / 2, -h / 2);
    night = beach(wall / 1000, w, h, hourNow(), dt); main.restore(); setC(main);
    black = 1 - clamp(bt / 0.8); bars = h * 0.085 * (1 - e);
  }
  if (bars > 0.5) { main.fillStyle = "#000"; main.fillRect(0, 0, w, bars); main.fillRect(0, h - bars, w, bars); }
  if (black > 0.01) { main.fillStyle = `rgba(0,0,0,${black})`; main.fillRect(0, 0, w, h); }
  if (key !== sceneKey) { sceneKey = key; vacAudio.scene(key); cap.textContent = tr(key === "beach" ? "Porto de Galinhas, Pernambuco · o jogo está em pausa" : SCENES.find(x => x[0] === key)[2]); cap.classList.remove("in"); void cap.offsetWidth; cap.classList.add("in"); }
  if (phase === "beach") { vacAudio.night(night); const fi = Math.floor(wall / 9000) % FACTS.length; if (fact.dataset.i !== String(fi)) { fact.dataset.i = fi; fact.textContent = tr(FACTS[fi]); fact.classList.remove("in"); void fact.offsetWidth; fact.classList.add("in"); } } else fact.textContent = "", fact.dataset.i = "";
  if (phase === "beach" && S.vacation) { const m = Math.floor((now() - S.vacation.since) / 60000); clock.textContent = `${tr("Em Pernambuco há")} ${m >= 1440 ? Math.floor(m / 1440) + " d " : ""}${m >= 60 ? Math.floor(m / 60) % 24 + " h " : ""}${m % 60} min`; } else clock.textContent = "";
  requestAnimationFrame(frame);
}
