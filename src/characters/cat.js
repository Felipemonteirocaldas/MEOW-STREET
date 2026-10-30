import { findPath } from "../engine/pathfind.js";
import { owns } from "../game/catalog.js";
import { tr } from "../lang.js";
import { LINES, S, flag, save } from "../game/state.js";
import { P, T, clamp100, g, pick } from "../engine/draw.js";
import { TRASH } from "../furniture/catalog-map.js";
import { shake } from "./roach.js";
import { overlayOpen, toast } from "../ui/overlays.js";
import { busy, dex, say, walkTo } from "./dex.js";
import { react } from "./reactions.js";
import { gainXp, petGain } from "../game/rpg-core.js";
import { activeMods } from "../game/production.js";
import { ROOMS } from "../engine/layout.js";
import { found } from "../furniture/core.js";

// ---------- Sombra, the black cat ----------
// wanders, naps on the softest thing around, eats from the bowl, knocks things over, and—if he likes you—reads the real news
export const CAT_FOOD = 1.5;
export const cat = { x: 2.5, y: 4.6, path: [], state: "idle", until: Date.now() + 3000, face: 1, walk: 0, say: "", sayUntil: 0, tipT: 40 };
const AI_RX = /(\b(ai|ia|a\.i\.|openai|llms?|gpt\w*|chatgpt|anthropic|claude|gemini|copilot|chatbots?|agents?|agentes?|nvidia|machine learning)\b|inteligência artificial)/i;
function catGo(x, y, state, ms) {
  const p = findPath(cat.x, cat.y, x, y);
  if (!p) return false;
  Object.assign(cat, { path: p, next: state, nextMs: ms }); cat.state = "walk"; return true;
}
function catNap() { // the best bed in the house, by cat standards
  const spot = owns("bed") ? [1.6, 8.9, 0.55] : owns("sofa") ? [3.25, 2.3, 0.45] : owns("armchair") ? [1.42, 5.4, 0.45] : [1.2, 8.8, 0.2];
  if (catGo(spot[0] + 0.3, spot[1], "sleep", 20000 + Math.random() * 20000)) { cat.napZ = spot[2]; cat.napAt = spot; }
}
function catSay(text, ms = 3500) { cat.say = tr(text); cat.sayUntil = Date.now() + ms; }
// Knocking things over, for real: walk to a surface, jump up, paw at the item, it falls in an arc and becomes trash on the floor.
// at = floor spot next to the furniture, top = where he stands on it, land = trash spot the item ends up in
const KNOCK = () => [
  { at: [8.35, 1.25], top: [8.35, 0.45, 0.9], land: 5 },  // stove
  { at: [7.55, 1.25], top: [7.55, 0.45, 0.9], land: 7 },  // kitchen sink
  { at: [2.1, 0.8], top: [2.1, 0.12, 0.55], land: 4 },    // radiator under the window
  { at: [4.95, 1.95], top: [5.5, 0.55, owns("desk") ? 0.75 : 0.56], land: 2 }, // R2-DEBT's desk
].filter(k => !S.trash.includes(k.land));
export let falling = null; // { i, from:[x,y,z], to:[x,y], t0 }
function catKnock() {
  const k = pick(KNOCK()); if (!k || S.trash.length >= 10) return false;
  if (!catGo(...k.at, "knock", 0)) return false;
  cat.knock = { k, t0: 0 }; return true;
}
function updateKnock(now) {
  const kn = cat.knock, k = kn.k; if (!kn.t0) kn.t0 = now;
  const e = now - kn.t0, ease = v => v * v * (3 - 2 * v);
  if (e < 350) { const s = ease(e / 350); cat.x = k.at[0] + (k.top[0] - k.at[0]) * s; cat.y = k.at[1] + (k.top[1] - k.at[1]) * s; cat.z = k.top[2] * s + Math.sin(s * Math.PI) * 0.3; } // jump up
  else if (e < 1500) { cat.z = k.top[2]; cat.paw = Math.floor(e / 180) % 2 === 0; if (!kn.eyed) { kn.eyed = true; catSay("..."); } } // paw, paw, look at Dex, paw
  else if (!kn.pushed) { kn.pushed = true; cat.paw = true; falling = { i: k.land, from: [k.top[0] + 0.15, k.top[1] + 0.2, k.top[2]], to: TRASH[k.land], t0: now }; }
  else if (e < 3200) { cat.paw = false; }
  else if (e < 3550) { const s = ease((e - 3200) / 350); cat.x = k.top[0] + (k.at[0] - k.top[0]) * s; cat.y = k.top[1] + (k.at[1] - k.top[1]) * s; cat.z = k.top[2] * (1 - s) + Math.sin(s * Math.PI) * 0.2; } // hop down
  else { cat.z = 0; cat.knock = null; cat.state = "idle"; cat.until = now + 4000; }
}
export function updateFalling(now) {
  if (!falling) return;
  const k = Math.min(1, (now - falling.t0) / 650), [x0, y0, z0] = falling.from, [x1, y1] = falling.to;
  falling.pos = [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k, Math.max(0, z0 * (1 - k * k) + 0.35 * Math.sin(k * Math.PI))];
  if (k < 1) return;
  if (!S.trash.includes(falling.i)) S.trash.push(falling.i);
  falling = null; shake(now + 300); toast("CRASH!");
  catSay("Mrr.", 2000);
  setTimeout(() => react("knock"), 450);
}
function catTip() {
  const a = S.cat.aff, news = activeMods().filter(m => !m.sponsored), ai = news.filter(m => AI_RX.test(m.headline));
  const m = ai.length && Math.random() < 0.6 ? pick(ai) : pick(news); // he has a soft spot for AI news
  if (a < 20 || !m) return ["Miau.", pick(["Ele me ignora. Típico de gato.", "Nem um olhar. Preciso conquistar esse bicho."])];
  const dir = tr(m.mult >= 1 ? "subir" : "cair");
  if (a < 50) return ["Miau?", tr("O Sombra não tira os olhos do {obj}... {line} vai {dir}?", { obj: tr(m.line === "hardware" ? "computador" : m.line === "software" ? "monitor" : "arquivo"), line: LINES[m.line].name, dir })];
  if (a < 80 || !S.market) return ["Miau!", tr("Acho que ele quer dizer: \"{h}\" ({s}). {line} vai {dir}.", { h: m.headline, s: m.source || tr("rádio"), line: LINES[m.line].name, dir })];
  const ch = S.market.change1h;
  return ["Mrrrau.", tr("\"{h}\" ({s}). E o BDC {move} na última hora. {advice}", { h: m.headline, s: m.source, move: Math.abs(ch) < 0.1 ? tr("ficou parado") : tr(ch >= 0 ? "subiu {p}%" : "caiu {p}%", { p: Math.abs(ch).toFixed(1) }), advice: tr(ch >= 1 ? "Ele acha que é hora de vender um pouco." : ch <= -1 ? "Ele diz: nada de vender no pânico." : "Ele diz: espera.") })];
}
export function updateCat(dt) {
  const c = S.cat, now = Date.now();
  c.hunger = Math.max(0, c.hunger - 0.008 * dt);
  if (c.hunger <= 0) c.aff = Math.max(0, c.aff - 0.004 * dt); // a starving cat stops liking you
  if (cat.path.length) {
    const [tx, ty] = cat.path[0], dx = tx - cat.x, dy = ty - cat.y, dist = Math.hypot(dx, dy);
    if (dist < 0.03) {
      cat.x = tx; cat.y = ty; cat.path.shift();
      if (!cat.path.length) {
        cat.state = cat.next || "idle"; cat.until = now + (cat.nextMs || 4000);
        if (cat.state === "sleep" && cat.napAt) [cat.x, cat.y] = cat.napAt; // hops up onto the bed/sofa
        if (cat.state === "eat") cat.face = -1;
      }
    }
    else { const s = Math.min(dist, 1.1 * dt); cat.x += dx / dist * s; cat.y += dy / dist * s; cat.walk += dt * 9; const sx = (dx - dy); if (Math.abs(sx) > 0.01) cat.face = sx > 0 ? 1 : -1; }
    return;
  }
  if (cat.state === "eat") { if (now > cat.until) { const k = Math.min(c.bowl, 50); c.bowl -= k; c.hunger = Math.min(100, c.hunger + k); cat.state = "idle"; cat.until = now + 3000; } return; }
  if (cat.state === "petted" && now < cat.until) return;
  if (cat.state === "knock" && cat.knock) return updateKnock(now);
  if (now < cat.until) return;
  // decide what's next (a pause first, so a failed path never retries every frame)
  cat.until = now + 2000; cat.napAt = null; cat.z = 0; cat.paw = false; cat.knock = null;
  const r = Math.random();
  if (c.hunger < 50 && c.bowl > 0) catGo(11.62, 3.85, "eat", 4000);
  else if (c.hunger < 25) { catSay("MIAU!"); setTimeout(() => say(pick(["Tá, tá, já vou pôr ração.", "Esse olhar de julgamento de novo..."])), 900); cat.until = now + 25000; }
  else if (c.aff > 60 && r < 0.3 && !dex.sleeping) catGo(dex.x + 0.5, dex.y + 0.3, "idle", 6000); // follows you around
  else if (r < 0.45) catNap();
  else if (r < 0.52 && catKnock()) { /* off to push something onto the floor */ }
  else { const rm = pick(ROOMS); catGo(rm.x0 + 0.6 + Math.random() * (rm.x1 - rm.x0 - 1.2), rm.y0 + 0.6 + Math.random() * (rm.y1 - rm.y0 - 1.2), "idle", 3000 + Math.random() * 6000); }
}
export function catTipTick(dt) {
  cat.tipT -= dt;
  if (cat.tipT > 0 || overlayOpen() || S.cat.hunger < 25) return;
  cat.tipT = 150 - S.cat.aff; // 150s at no affection, 50s at full
  const [meow, line] = catTip(); catSay(meow); setTimeout(() => say(line, 7000), 1100);
}
export function petCat() {
  const c = S.cat, now = Date.now();
  Object.assign(cat, { path: [], state: "petted", until: now + 8000, z: 0, paw: false, knock: null }); // he waits for the hand (he knows)
  catSay(pick(["Mrr?", "...", "Miau?"]), 1500);
  walkTo(cat.x + 0.45, cat.y + 0.15, () => {
    cat.state = "petted"; cat.until = Date.now() + 3500; cat.path = [];
    busy(1600, () => {
      if (now - (c.lastPet || 0) < 15000) { c.aff = Math.max(0, c.aff - 2); catSay("HSSS!"); say("Ai! Arranhão. Ok, ok, chega de carinho."); }
      else {
        c.aff = Math.min(100, c.aff + petGain(6)); flag("pet"); S.stat.pets++; gainXp(6); S.needs.diversao = clamp100(S.needs.diversao + 6); catSay("Purrr..."); hearts(cat.x, cat.y);
        found("cat", "Uma coleira escondida no pelo. Na plaqueta: 'SOMBRA · BD-0'.");
      }
      c.lastPet = Date.now(); save();
    }, "pet");
  });
}
export const heartFx = [];
function hearts(x, y) { for (let i = 0; i < 4; i++) heartFx.push({ x, y, t: -i * 0.15, dx: (Math.random() - 0.5) * 0.4 }); }
export function drawCat() {
  const u = T / 8, t = Date.now() / 1000, sleep = cat.state === "sleep" && !cat.path.length, z = sleep ? cat.napZ || 0 : cat.z || 0;
  const [x, y] = P(cat.x, cat.y, z), f = cat.face, moving = cat.path.length > 0;
  g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.ellipse(x, y, 2.2 * u, 0.9 * u, 0, 0, 7); g.fill();
  g.fillStyle = "#0b0b0d"; g.strokeStyle = "rgba(120,120,130,.5)"; g.lineWidth = Math.max(0.5, u * 0.15);
  if (sleep) { // curled up, tail around, slow breathing
    const b = 1 + Math.sin(t * 2) * 0.04;
    g.beginPath(); g.ellipse(x, y - 1.1 * u, 2 * u * b, 1.2 * u * b, 0, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.arc(x + 1.3 * u * f, y - 1.6 * u, 0.9 * u, 0, 7); g.fill();
    g.strokeStyle = "#0b0b0d"; g.lineWidth = u * 0.6; g.beginPath(); g.arc(x, y - 1 * u, 2 * u, 0.3, 2.6); g.stroke();
    g.fillStyle = "#d8d4cc"; g.font = `${T * 0.22}px serif`; g.fillText("z", x - 1.6 * u * f + (t % 2) * u, y - 3 * u - (t % 2) * u * 2);
  } else {
    const eat = cat.state === "eat", step = moving ? Math.sin(cat.walk) * 0.5 * u : 0;
    g.lineWidth = u * 0.45; g.strokeStyle = "#0b0b0d";
    for (const [lx, s] of [[-1.1, 1], [-0.6, -1], [0.7, -1], [1.2, 1]]) { g.beginPath(); g.moveTo(x + lx * u * f, y - 1.4 * u); g.lineTo(x + lx * u * f + step * s, y); g.stroke(); } // legs
    g.beginPath(); g.ellipse(x, y - 1.8 * u, 1.9 * u, 0.9 * u, 0, 0, 7); g.fill(); // body
    g.lineWidth = u * 0.5; g.beginPath(); g.moveTo(x - 1.7 * u * f, y - 2 * u); // tail, swaying
    g.quadraticCurveTo(x - 3 * u * f, y - 2.5 * u, x - 2.6 * u * f + Math.sin(t * 2.5) * u, y - 4.3 * u); g.stroke();
    const hx = x + 1.9 * u * f, hy = y - (eat ? 1.2 : 2.8) * u;
    g.beginPath(); g.arc(hx, hy, 0.95 * u, 0, 7); g.fill(); // head
    g.beginPath(); g.moveTo(hx - 0.8 * u, hy - 0.4 * u); g.lineTo(hx - 0.55 * u, hy - 1.6 * u); g.lineTo(hx - 0.05 * u, hy - 0.7 * u);
    g.moveTo(hx + 0.8 * u, hy - 0.4 * u); g.lineTo(hx + 0.55 * u, hy - 1.6 * u); g.lineTo(hx + 0.05 * u, hy - 0.7 * u); g.fill(); // ears
    if (cat.paw) { g.strokeStyle = "#0b0b0d"; g.lineWidth = u * 0.45; g.beginPath(); g.moveTo(hx - 0.3 * u * f, hy + 0.8 * u); g.lineTo(hx + 1.6 * u * f, hy - 0.2 * u); g.stroke(); g.fillStyle = "#0b0b0d"; } // swiping paw
    if (!eat && Math.sin(t * 0.7) < 0.97) { g.fillStyle = "#d4e04a"; g.beginPath(); g.arc(hx - 0.35 * u + 0.15 * u * f, hy - 0.1 * u, 0.22 * u, 0, 7); g.arc(hx + 0.35 * u + 0.15 * u * f, hy - 0.1 * u, 0.22 * u, 0, 7); g.fill(); } // glowing eyes (they blink)
  }
  cat.top = y - 4.5 * u;
  cat.box = [x - 3 * u, y - 4.5 * u, x + 3 * u, y + u];
}

