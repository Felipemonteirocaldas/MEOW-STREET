import { tr } from "../lang.js";
import { S, gameOver, now, save } from "../game/state.js";
import { say } from "../characters/dex.js";
import { pick } from "../engine/draw.js";
import { fmtUSD } from "../game/market.js";
import { toast } from "./overlays.js";
import { scamOdds } from "../game/rpg-core.js";

// the phone: brokers with "sure things". Most of them are scams (expected return 0.8×).
const callEl = document.getElementById("call"), callc = document.getElementById("callc");
const CALLERS = [
  { name: "Sal 'Sorriso' Benedetti, corretor", pitch: "Garoto, tenho uma dica quente: ações da Vidrion antes do anúncio. Coisa certa.", mult: 3 },
  { name: "Voz sem nome", pitch: "Eu sei o que o R2-DEBT faz. Me adianta um dinheiro e eu dobro antes da meia-noite.", mult: 2 },
  { name: "Madame Zora, consultora financeira", pitch: "As cartas não mentem, querido: Cumulus Corp. Agora ou nunca.", mult: 4 },
];
for (const c of CALLERS) { c.name = tr(c.name); c.pitch = tr(c.pitch); }
export let ringing = false;
S.deals = S.deals || [];
setInterval(() => {
  if (!ringing && !gameOver && !S.vacation && Math.random() < 0.08) { ringing = true; say("O telefone. Quem liga a essa hora?"); setTimeout(() => { ringing = false; }, 45000); }
}, 60000);
export function answerCall() {
  ringing = false;
  const stake = Math.max(5, Math.round(S.usd * 0.4)), c = pick(CALLERS);
  callc.innerHTML = `<div class="mast" style="font-size:24px">${tr("Ligação")}</div><p><i>"${c.pitch}"</i></p><p class="tip">— ${c.name}</p>
    <p>${tr("Investir <b>{v}</b>? Retorno prometido: <b>{m}×</b> em 2 minutos.", { v: fmtUSD(stake), m: c.mult })}</p>
    <div class="trade"><button data-deal="${stake}" data-mult="${c.mult}" ${S.usd < stake ? "disabled" : ""}>${tr("Aceitar")}</button><button data-hang style="background:#1b1b1b">${tr("Desligar")}</button></div>`;
  callEl.hidden = false;
}
callEl.addEventListener("pointerdown", e => {
  const d = e.target.closest("[data-deal]");
  if (d && !d.disabled) {
    const stake = +d.dataset.deal; S.usd -= stake;
    S.deals.push({ stake, mult: +d.dataset.mult, at: now() + 120000 }); save();
    say("Feito. Agora é rezar."); callEl.hidden = true; return;
  }
  if (e.target.closest("[data-hang]") || !e.target.closest(".news-paper")) { callEl.hidden = true; say("Golpista. Essa cidade tá cheia."); }
});
setInterval(() => {
  if (S.vacation) return;
  for (const d of S.deals.filter(x => now() >= x.at)) {
    if (Math.random() < Math.min(0.95, scamOdds() / d.mult)) { S.usd += d.stake * d.mult; toast(tr("Deu certo! +{v}", { v: fmtUSD(d.stake * d.mult) })); say("Não acredito. Deu certo."); }
    else { toast(tr("O corretor sumiu com {v}", { v: fmtUSD(d.stake) })); say("Número desligado. Levaram meu dinheiro. Clássico."); }
  }
  S.deals = S.deals.filter(x => now() < x.at);
}, 2000);
if (S.burgled) { const lost = S.burgled; S.burgled = 0; setTimeout(() => say(tr("Alguém entrou aqui. Levaram {v}. A porta estava destrancada.", { v: fmtUSD(lost) }), 7000), 2500); }

