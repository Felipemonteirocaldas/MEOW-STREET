import { S } from "../game/state.js";
import { deal, draw, pokerTick } from "../game/poker.js";
import { HANDS, PAY, nearMiss } from "../game/poker-hand.js";
import { fmt } from "../game/production.js";
import { chirp } from "../audio/droid.js";
import { buzz } from "./haptics.js";
import { tr } from "../lang.js";

// The "Mão do Dex" sheet: deal five, tap the cards to hold, draw once. Wins pay minutes of production.
const el = document.getElementById("pokerov"), box = document.getElementById("pokerc");
let held = [false, false, false, false, false], result = null;
const face = c => `${["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"][c % 13]}<br>${"♣♦♥♠"[Math.floor(c / 13)]}`;
const mmss = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

function render() {
  const p = S.poker, cards = result ? result.cards : p.hand ? p.hand.cards : null;
  const row = cards ? cards.map((c, i) => `<button class="pcard ${[1, 2].includes(Math.floor(c / 13)) ? "red" : ""} ${!result && held[i] ? "held" : ""}" data-i="${i}" style="animation-delay:${i * 90}ms" ${result ? "disabled" : ""}>${face(c)}</button>`).join("")
    : Array.from({ length: 5 }, () => `<span class="pcard back"></span>`).join("");
  const near = result ? nearMiss(result.cards) : -1; // used sparingly: only when the final hand really was one card short of something better
  const msg = result ? (result.k ? `<b class="win">${tr(HANDS[result.k])}</b> · +${fmt(result.bdc)} BDC` : tr("Nada desta vez. A próxima vem logo.")) + (near > result.k ? `<div class="near">${tr("Faltou 1 carta para {h}!", { h: tr(HANDS[near]).toLowerCase() })}</div>` : "")
    : p.hand ? tr("Toque nas cartas que quer segurar e troque o resto.") : tr("Uma mão grátis a cada 6 minutos, e elas se acumulam até 3.");
  const act = p.hand && !result ? ["draw", tr("Trocar cartas"), false]
    : p.charges ? ["deal", tr(result ? "Mais uma mão" : "Dar as cartas"), false]
    : ["", tr("Próxima mão em {t}", { t: `<span id="pk-t">${mmss(p.next - Date.now())}</span>` }), true];
  box.innerHTML = `<div class="pk-row">${row}</div><div class="pk-msg">${msg}</div>
    <div class="chips"><div class="chip up"><b>${p.charges}</b> <span>${tr("mãos guardadas")}</span></div><div class="chip"><b>${p.hands}</b> <span>${tr("jogadas")}</span></div><div class="chip"><b>${tr(HANDS[p.best])}</b> <span>${tr("melhor mão")}</span></div></div>
    <button class="reopen" data-act="${act[0]}" ${act[2] ? "disabled" : ""}>${act[1]}</button>
    <div class="pk-pay">${PAY.map((u, k) => k ? `<span class="${result && result.k === k ? "on" : ""}">${tr(HANDS[k])} <b>×${u}</b></span>` : "").join("")}</div>
    <div class="sub">${tr("×1 equivale a 30 s da sua produção atual.")}</div>`;
}
box.addEventListener("click", e => {
  const c = e.target.closest("[data-i]"), a = e.target.closest("[data-act]");
  if (c && S.poker.hand && !result) { held[+c.dataset.i] = !held[+c.dataset.i]; c.classList.toggle("held"); buzz(8); return; }
  if (!a) return;
  if (a.dataset.act === "deal") { held = [false, false, false, false, false]; result = null; if (deal()) { chirp(2); render(); } }
  else if (a.dataset.act === "draw") {
    result = draw(held); if (!result) return;
    if (result.k) { chirp(4 + Math.floor(Math.sqrt(PAY[result.k]))); buzz(result.k >= 4 ? [30, 40, 60] : 25); }
    render();
  }
});
setInterval(() => {
  if (el.hidden) return;
  pokerTick(); const t = document.getElementById("pk-t");
  if (t) { t.textContent = mmss(S.poker.next - Date.now()); if (S.poker.charges) render(); }
}, 1000);
export function openPoker() { if (!S.poker.hand) result = null; render(); el.hidden = false; }
