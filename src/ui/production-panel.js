import { LINES, S, esc, now } from "../game/state.js";
import { levelBonus } from "../game/rpg-core.js";
import { legacyMult } from "../game/prestige.js";
import { catMult, cost, fmt, lineBreakdown, lineMult, lineRate, totalRate } from "../game/production.js";
import { fmtUSD } from "../game/market.js";
import { FURN_UP } from "../game/catalog.js";
import { needsMult } from "../game/needs.js";
import { tr } from "../lang.js";
import { ico } from "./icons.js";
import { gainXp } from "../game/rpg-core.js";

// The "Produção" sheet: what R2-DEBT mines, what is speeding it up or slowing it down, and what the next upgrade is worth.
const INFO = {
  hardware: { glyph: "⚙", what: "Chips e placas. Sobe com notícias de chips e GPUs; cai com escassez, tarifas e recalls. O upgrade do PC multiplica esta linha." },
  software: { glyph: "{ }", what: "Código e IA. Sobe com notícias de IA, código aberto e lançamentos; cai com demissões e falências." },
  dados: { glyph: "▤", what: "Dados e nuvem. Sobe com notícias de nuvem, privacidade e criptografia; cai com vazamentos, ataques e multas." },
};
const el = document.getElementById("lines");
const pct = v => (v >= 1 ? "+" : "") + Math.round((v - 1) * 100) + "%";
const mins = ms => Math.max(1, Math.ceil(ms / 60000));
const clip = (t, n) => t.length > n ? t.slice(0, n - 1) + "…" : t;
const dur = sec => sec < 90 ? Math.ceil(sec) + " s" : sec < 5400 ? Math.round(sec / 60) + " min" : (sec / 3600).toFixed(1) + " h";

// total price of the next n levels (each costs 15% more than the last)
const bulkCost = (l, n) => { let t = 0; for (let i = 0; i < n; i++) t += Math.ceil(LINES[l].cost * Math.pow(1.15, S.levels[l] + i)); return t; };
const maxAfford = l => { let n = 0; while (n < 200 && bulkCost(l, n + 1) <= S.cycles) n++; return n; };

// one chip per factor scaling a line
function chip(f) {
  const cls = f.value > 1.001 ? "up" : f.value < 0.999 ? "down" : "";
  const val = `<b>×${f.value.toFixed(2)}</b>`;
  if (f.kind === "news") return `<div class="chip ${cls}">${f.value >= 1 ? "▲" : "▼"} ${val} <span>${esc(clip(f.mod.headline, 54))} · ${mins(f.mod.until - now())} min</span></div>`;
  const text = {
    ad: tr("Anúncio: bônus de {m} min", { m: mins(f.until - now()) }),
    dex: tr(needsMult() >= 1.1 ? "Dex bem cuidado" : needsMult() < 0.95 ? "Dex negligenciado (coma, durma, descanse)" : "Necessidades do Dex"),
    cat: tr(S.cat.hunger <= 0 ? "Sombra com fome (-5%)" : "Sombra, afeto {a}%", { a: Math.round(S.cat.aff) }),
    pc: tr("PC: {n}", { n: FURN_UP.pc.tiers[S.furn.pc] }),
    power: tr("Luz cortada: pague a conta!"),
    lvl: tr("Nível {n} do Dex", { n: S.rpg.lvl }), legacy: tr("Legado: {n} pontos", { n: S.legacy.total }), build: tr("Seus talentos"), lab: tr("Laboratório"), ability: tr("Habilidade ativa!"),
  }[f.kind];
  const icon = { ad: "radio", dex: "mood", cat: "cat", pc: "produce", power: "power", lvl: "trophy", legacy: "clue", build: "exchange", lab: "shop", ability: "energy" }[f.kind];
  return `<div class="chip ${cls}">${ico(icon)} ${val} <span>${text}</span></div>`;
}

export function renderLines() {
  if (document.getElementById("prod").hidden) return; // nobody is looking; the HUD ticks 4x a second
  const rate = totalRate(), perMin = rate * S.price * 60;
  const lines = Object.keys(LINES).map(l => {
    const mu = lineMult(l), now1 = lineRate(l), next = LINES[l].prod * mu, n10 = Math.min(10, Math.max(1, maxAfford(l))), c1 = cost(l);
    const payback = next > 0 ? c1 / next : Infinity;
    return `<div class="card pcard"><div class="row"><div class="name"><span class="glyph">${INFO[l].glyph}</span> ${LINES[l].name} <span class="sub">${tr("nv")} ${S.levels[l]}</span></div>
        <div class="${mu > 1.001 ? "up" : mu < 0.999 ? "down" : ""}"><b>${fmt(now1)}</b>/s <span class="sub">×${mu.toFixed(2)}</span></div></div>
      <div class="sub why">${tr(INFO[l].what)}</div>
      <div class="chips">${lineBreakdown(l).filter(f => !["dex", "cat", "lvl", "legacy"].includes(f.kind) && (f.kind === "news" || Math.abs(f.value - 1) > 0.001 || f.kind === "pc")).map(chip).join("") || ""}
        ${lineBreakdown(l).some(f => f.kind === "news") ? "" : `<div class="chip"><span>${tr("Nenhuma notícia mexendo nesta linha agora")}</span></div>`}</div>
      <div class="row buy"><div class="sub">${tr("Próximo nível: +{g}/s", { g: fmt(next) })} · ${payback === Infinity ? "" : tr("se paga em ~{t}", { t: dur(payback) })}</div>
        <div class="btns"><button data-buy="${l}" data-n="1" ${S.cycles < c1 ? "disabled" : ""}>${tr("Comprar")} · ${fmt(c1)}</button>
          ${S.levels[l] >= 1 || maxAfford(l) > 1 ? `<button data-buy="${l}" data-n="${n10}" class="alt" ${maxAfford(l) < 2 ? "disabled" : ""}>×${n10 >= 2 ? n10 : 10} · ${fmt(bulkCost(l, n10 >= 2 ? n10 : 10))}</button>` : ""}</div></div></div>`;
  }).join("");
  const globals = [{ kind: "dex", value: needsMult() }, { kind: "cat", value: catMult() }, { kind: "lvl", value: levelBonus() }, ...(S.legacy.total ? [{ kind: "legacy", value: legacyMult() }] : [])];
  el.innerHTML = `<div class="card summary"><div class="row"><div><div class="sub">${tr("Produção agora")}</div><div class="big"><b>${fmt(rate)}</b> BDC/s</div></div>
      <div class="right"><div class="sub">${tr("Valor aproximado")}</div><div class="big">${fmtUSD(perMin)}<span class="sub">/min</span></div></div></div>
      <div class="chips">${globals.map(chip).join("")}</div>
      <div class="sub">${tr("Como funciona: cada nível dá uma produção fixa. As notícias reais de agora, o humor do Dex e o carinho do Sombra multiplicam esse total. Gaste BDC em níveis, ou venda na Corretora para pagar as contas.")}</div></div>${lines}
    <div class="card tips"><div class="name">${tr("Quer produzir mais?")}</div><ul class="sub">
      <li>${tr("Cuide do Dex: comida, sono, ânimo e higiene (até +25%).")}</li><li>${tr("Faça carinho e alimente o Sombra: afeto alto dá até +10%.")}</li>
      <li>${tr("Leia a aba Notícias: manchetes de chips, IA e dados mexem nas linhas por minutos.")}</li><li>${tr("Assista aos comerciais na TV ou no rádio para ganhar ×2 por 10 min.")}</li>
      <li>${tr("Melhore o PC no Catálogo: Hardware ×1,5 e ×2,2.")}</li><li>${tr("Pague a conta de luz: sem energia, tudo cai para 30%.")}</li></ul></div>`;
}

// pointerdown, not click: the sheet re-renders 4x a second and would swallow slow taps
document.addEventListener("pointerdown", e => {
  const b = e.target.closest("[data-buy]"); if (!b || b.disabled) return;
  const l = b.dataset.buy, n = +b.dataset.n || 1, c = bulkCost(l, n);
  if (S.cycles >= c) { S.cycles -= c; S.levels[l] += n; gainXp(4 * n); renderLines(); }
});
