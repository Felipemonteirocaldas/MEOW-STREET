import { LANG, tr } from "../lang.js";
import { findPath } from "../engine/pathfind.js";
import { O } from "../furniture/core.js";
import { S } from "../game/state.js";
import { TRASH, firstLive } from "../furniture/catalog-map.js";
import { clamp100, pick, tier } from "../engine/draw.js";
import { SLEEP_RATE, owns } from "../game/catalog.js";
import { powerCut } from "../game/bills.js";
import { overlayOpen, tv } from "../ui/overlays.js";
import { camAnim } from "../engine/camera.js";
import { CAT_FOOD, petCat } from "./cat.js";
import { react } from "./reactions.js";
import { wc } from "../furniture/bathroom/_shared.js";
import { ROOMS } from "../engine/layout.js";
import { activeMods, totalRate } from "../game/production.js";
import { fmtUSD } from "../game/market.js";
import { askBD1 } from "./bd1.js";

// ---------- Dex ----------
export const dex = { x: 4.95, y: 1.25, z: 0.12, v: 0, path: [], then: null, seat: null, moving: false, sit: true, sleeping: false, busy: null,
  cleaning: false, front: false, walk: 0, idle: 0, chat: 5, say: "", sayUntil: 0, box: null, top: 0 };
export const DEX_LINES = [
  "Bom garoto, R2-DEBT. Continua processando.", "Essa cidade tem oito milhões de histórias. A minha é a mais estranha.",
  "Se a companhia telefônica me visse agora...", "O cachorro preto não dorme. Nem eu.", "Chove em Nova York como se devesse alguma coisa.",
  "Alguém está me seguindo. Ou eu estou seguindo alguém.", "Lena dizia que máquinas não sonham. O R2-DEBT fala dormindo.",

  // Ripley and Mad Men: cold, elegant, a little false
  "É mais fácil ser um falsário elegante do que um falido honesto.",
  "Todo mundo tem um talento. O meu é fingir que está tudo bem.",
  "Nápoles tem escadarias de pedra. O meu prédio tem cheiro de repolho.",
  "Ser outra pessoa parece tentador. Mas aí eu teria as contas dele.",
  "O que chamam de felicidade eu chamo de um anúncio bem escrito.",
  "Não gosta da manchete? Muda a conversa.",
  "Um uísque às dez da manhã não é vício. É pesquisa de mercado.",
  "Nostalgia: uma ferida velha que só dói quando acendem a luz certa.",
  "Na Madison Avenue ninguém vende produto. Vendem a promessa. Eu vendo BDC.",
  "Terno escuro, olhar cansado, copo vazio. O uniforme de qualquer manhã.",
  // the computer is a droid of dubious lineage
  "Esse R2 apita como se tivesse sentimentos. Só tem dívida.",
  "Bip bop uma ova. Fala português, R2.",
  "Já vi um robozinho salvar uma galáxia. O meu só avisa que o aluguel venceu.",
  "Ajuda-me, Dex-Kenobi. Você é a minha única esperança. ...Foi um sonho. Ou a Lena.",
  "Se o R2 falasse comigo em vez de apitar, a gente já tinha quitado a luz.",
  // movies and shows, pulled into a broke detective's life
  "Você está falando comigo? ...Você está falando comigo? Ah, é só o R2-DEBT.",
  "Vou fazer ao síndico uma oferta que ele não vai poder recusar. Tipo, uma desculpa.",
  "Hasta la vista, baby. Digo... conta de luz.",
  "Que a Força esteja com o meu saldo.",
  "Houston, temos um problema. Na verdade são as contas.",
  "Já vi coisas que vocês não acreditariam. Principalmente a minha conta de luz.",
  "Winter is coming. A conta de luz também.",
  "Eu sou aquele que bate na porta. Só que quem bate aqui é o síndico.",
  "A primeira regra do clube da luta é: eu não lembro. R2-DEBT, pesquisa.",
  "Pílula vermelha ou azul? Eu fico com a que paga o aluguel.",
  "A vida é uma caixa de bombons. A minha veio vazia.",
  "Sempre teremos Paris. Eu só tenho Nova York e uma torneira pingando.",
  "Se tem algo estranho na vizinhança, quem eu chamo? O síndico. Pior ainda.",
  "De volta para o futuro? Eu voltava pro dia antes de assinar esse aluguel.",
  "Ao infinito e além... do limite do cartão.",
  "Vamos precisar de um apartamento maior.",
  "Yippee-ki-yay, senhor síndico.",
  "A vida encontra um caminho. A barata também.",
  "Meu precioso... o último pedaço de pizza.",
  "Elementar, meu caro R2-DEBT. Só não sei como pagar o aluguel.",
  "Meu nome é Dex. Só Dex. Sem martíni, sem licença pra nada.",
  "Show me the money! ...Não, R2-DEBT, você é que me mostra.",
  "Você não aguenta a verdade! Nem a conta de luz.",
  "E.T. telefone casa. Eu também, mas cortaram a linha.",
  "Pivot! PIVOT! ...Não, o sofá não passa na porta.",
  "Eggos! Tá, só tenho bagel. Mas a energia é a mesma.",
  "Eu sinto a necessidade... a necessidade de dormir.",
  "A vida passa rápido. Se você não parar pra olhar, perde a promoção do bagel.",
  "Fim de jogo, cara. Fim de jogo. ...Ah, falta ver o saldo.",
  "Meu plano de saúde é o gato. E ele nem gosta de mim.",
  "Pijama de bolinha e paletó. Dress code: falência elegante.",
  "Tecnicamente sou um detetive. Na prática, um desempregado de chapéu.",
  "Se eu vender um rim, o R2-DEBT ganha upgrade?",
  "R2-DEBT, se eu vender o rádio, compro o quê? ...Metade do rádio. Valeu.",
  "Caixote de fruta é o novo escritório moderno. Está em todas as revistas.",
  "Eu não estou desempregado. Estou em transição de carreira... eterna.",
  "Nunca confie num computador que não paga aluguel. Exceto o R2-DEBT. Talvez.",
];
export function say(text, ms = 4500) { dex.say = tr(text); dex.sayUntil = Date.now() + ms; }
export function busy(ms, done, kind = "") { dex.busy = { until: Date.now() + ms, ms, done, kind }; }
export function walkTo(x, y, then, seat) {
  const p = findPath(dex.x, dex.y, x, y);
  if (!p) { say("Não tem como chegar aí."); return false; }
  Object.assign(dex, { sit: false, z: 0, sleeping: false, busy: null, path: p, then: then || null, seat: seat || null, idle: 0 });
  if (seat) p.push([seat.x, seat.y]);
  if (!p.length) arrive();
  return true;
}
function arrive() {
  const d = dex; d.moving = false; d.v = 0;
  if (d.seat) { Object.assign(d, { sit: !d.seat.stand, z: d.seat.z, front: d.seat.front }); d.seat = null; } else d.front = true;
  const f = d.then; d.then = null; f && f();
}
export function use(o, auto = false) { // auto: Dex's own free will (no pop-up screens)
  if (!o || !o.act) return false; // pure furniture: nothing to do, and no crash
  if (o.walk === false || !o.spot) return o.act(auto);
  const seat = typeof o.seat === "function" ? o.seat() : o.seat;
  return walkTo(o.spot[0], o.spot[1], () => { if (!seat) dex.front = false; o.act(auto); }, seat);
}
export const byId = id => O.find(o => o.id === id);

export function updateDex(dt) {
  const d = dex, n = S.needs;
  if (d.path.length && Date.now() < (d.slipUntil || 0)) { d.moving = false; d.v = 0; } // flat on his back
  else if (d.path.length) {
    const [tx, ty] = d.path[0], dx = tx - d.x, dy = ty - d.y, dist = Math.hypot(dx, dy);
    let rem = dist; for (let i = 1; i < d.path.length; i++) rem += Math.hypot(d.path[i][0] - d.path[i - 1][0], d.path[i][1] - d.path[i - 1][1]);
    if (dist < 0.03) { d.x = tx; d.y = ty; d.path.shift(); if (!d.path.length) arrive(); }
    else {
      d.v = Math.min(d.v + 5 * dt, 1.8, Math.sqrt(2 * 5 * rem) + 0.1); // accelerate, cap, brake before the stop
      const s = Math.min(dist, d.v * dt); d.x += dx / dist * s; d.y += dy / dist * s;
      d.moving = true; d.front = dx + dy > 0; d.walk += dt * 4.5 * d.v;
      const peel = S.trash.find(i => (i * 7) % 4 === 3 && Math.hypot(TRASH[i][0] - d.x, TRASH[i][1] - d.y) < 0.3);
      if (peel !== undefined && Date.now() > (d.noSlip || 0)) { // slapstick: half the time he slips on the peel
        d.noSlip = Date.now() + 8000;
        if (Math.random() < 0.5) {
          d.slipUntil = Date.now() + 1800; say("AAAAI!", 1500);
          setTimeout(() => { S.trash = S.trash.filter(t => t !== peel); Math.random() < 0.65 ? react("slip") : say(pick(["Ninguém viu. Ninguém viu nada.", "Minha dignidade ficou ali no chão."])); }, 1900);
        }
      }
    }
  } else if (d.sleeping) {
    n.energia = clamp100(n.energia + (owns("bed") ? SLEEP_RATE[tier("cama")] : 3) * dt);
    if (n.energia >= 100) { say("Bom dia, Nova York. Ou boa noite."); walkTo(2.6, 9.0); }
  } else if (d.busy) {
    if (d.busy.kind === "work" && !powerCut()) { const g = totalRate() * 0.1 * dt; S.cycles += g; S.run.mined += g; /* hands-on work: +10% */ n.energia = clamp100(n.energia - 0.03 * dt); }
    if (Date.now() > d.busy.until) { const f = d.busy.done; d.busy = null; f(); }
  } else if (d.cleaning && S.trash.length) {
    const i = S.trash.reduce((a, b) => Math.hypot(TRASH[a][0] - d.x, TRASH[a][1] - d.y) < Math.hypot(TRASH[b][0] - d.x, TRASH[b][1] - d.y) ? a : b);
    pickUp(i);
  } else if (!tv && !camAnim && !overlayOpen()) {
    d.cleaning = false;
    d.idle += dt;
    // free will: Dex looks after himself when a need runs low
    if (d.idle > 3) {
      if (n.fome < 30) use(byId("fridge"), true);
      else if (n.energia < 25) use(firstLive("bed", "mattress"), true);
      else if (n.higiene < 30) use(firstLive("tub", "shower"), true);
      else if (S.trash.length >= 6) { d.cleaning = true; say("Esse lugar parece cena de crime."); }
      else if (S.cat.hunger < 20 && S.cat.bowl <= 0 && S.usd >= CAT_FOOD) use(byId("catbowl"), true); // Dex won't let Sombra starve
      else if (n.diversao < 40 && S.cat.aff > 30 && Date.now() - (S.cat.lastPet || 0) > 60000) petCat();
      else if (n.diversao < 30) use(pick(["armchair", "table", "records", "radio"].map(id => firstLive(id)).filter(Boolean)), true);
      else if (d.idle > 12) {
        const r = Math.random();
        if (r < 0.12 && !S.poo && Date.now() - wc.last > 240000) use(byId("toilet"), true); // nature calls, at most once every 4 minutes
        else if (r < 0.5 && !powerCut()) use(firstLive("desk", "crates"), true);
        else { const r = pick(ROOMS); walkTo(r.x0 + 0.8 + Math.random() * (r.x1 - r.x0 - 1.6), r.y0 + 0.8 + Math.random() * (r.y1 - r.y0 - 1.6)); }
      }
    }
  }
  d.chat -= dt;
  if (d.chat <= 0 && !tv && !d.sleeping) {
    d.chat = 16 + Math.random() * 12;
    const news = activeMods().filter(m => !m.sponsored);
    const wx = S.weather, r = Math.random(), item = pick(news);
    if (powerCut()) react("powerCut");
    else say(item && r < 0.35 ? tr("Ouvi no rádio: \"{h}\" ({s}).", { h: item.headline, s: item.source || tr("rádio") })
      : wx && r < 0.5 ? tr("Lá fora: {t}°C{w}. Típico.", { t: Math.round(LANG === "en" ? wx.temp * 9 / 5 + 32 : wx.temp), w: tr(wx.rain ? " e chuva" : wx.snow ? " e neve" : wx.fog ? " e neblina" : "") })
      : S.market && r < 0.6 ? tr("BDC a {p}. {dir} {pct}% na última hora.", { p: fmtUSD(S.price), dir: tr(S.market.change1h >= 0 ? "Subindo" : "Caindo"), pct: Math.abs(S.market.change1h).toFixed(1) })
      : r < 0.7 ? askBD1()
      : pick(DEX_LINES));
  }
}
export function pickUp(i) {
  const [x, y] = TRASH[i];
  walkTo(x, y + 0.45, () => busy(1200, () => { S.trash = S.trash.filter(t => t !== i); }, "clean"));
}

