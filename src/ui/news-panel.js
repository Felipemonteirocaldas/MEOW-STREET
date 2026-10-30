import { LINES, S, esc, now } from "../game/state.js";
import { owns } from "../game/catalog.js";
import { tr } from "../lang.js";

// The "Notícias" sheet: today's real headlines, each with the production line it moves and for how long.
const FACTIONS = {
  aurora: { name: "Aurora", why: "Avanço tecnológico" }, "rede-livre": { name: "Rede Livre", why: "Código aberto e lançamentos" },
  sentinelas: { name: "Sentinelas", why: "Segurança e dados" }, conselho: { name: "Conselho", why: "Reguladores e crises" },
  patrocinado: { name: "Patrocinado", why: "Comercial" }, sponsored: { name: "Sponsored", why: "Commercial" },
};
const el = document.getElementById("news");
const when = ms => { const m = Math.ceil(ms / 60000); return m >= 60 ? Math.floor(m / 60) + " h " + (m % 60 ? m % 60 + " min" : "") : m + " min"; };

export function renderNews() {
  if (document.getElementById("newsov").hidden) return;
  const list = Object.entries(S.mods).filter(([, m]) => m.until > now()).sort(([, a], [, b]) => Math.abs(b.mult - 1) - Math.abs(a.mult - 1));
  const news = list.filter(([, m]) => !m.sponsored), good = news.filter(([, m]) => m.mult >= 1).length;
  const head = `<div class="card summary"><div class="sub">${tr("Cada manchete real de agora mexe numa linha de produção por alguns minutos. ▲ ajuda, ▼ atrapalha. O R2-DEBT lê tudo; você só precisa decidir quando investir.")}</div>
    <div class="chips"><div class="chip up"><b>▲ ${good}</b> <span>${tr("ajudando")}</span></div><div class="chip down"><b>▼ ${news.length - good}</b> <span>${tr("atrapalhando")}</span></div>
    <div class="chip"><span>${tr("Atualiza sozinho a cada 30 s")}</span></div></div></div>`;
  const cards = list.map(([id, m]) => {
    const up = m.mult >= 1, f = FACTIONS[m.faction] || { name: m.faction, why: "" }, left = m.until - now(), total = (m.dur_min || 60) * 60000;
    const bar = `<div class="timer"><b style="width:${Math.max(3, Math.min(100, left / total * 100))}%"></b></div>`;
    const ad = !m.sponsored ? "" : S.claimed[id]
      ? `<div class="sub up">${tr("Bônus ×{m} ativo para {line}", { m: m.reward.mult, line: LINES[m.line].name })}</div>`
      : `<div class="sub" style="margin-top:6px">${tr(owns("tv") ? "📺 Passando na TV: assista para ganhar ×{m} por {d} min" : "📻 Tocando no rádio: ouça para ganhar ×{m} por {d} min", { m: m.reward.mult, d: m.reward.dur_min })}</div>`;
    return `<div class="card ncard ${m.sponsored ? "sponsored" : up ? "good" : "bad"}"><div class="row"><span class="tag">${m.sponsored ? tr("PATROCINADO · ") + esc(m.advertiser) : esc(tr(f.name))}</span>
      <span class="pill ${up ? "up" : "down"}">${up ? "▲" : "▼"} ${LINES[m.line].name} ×${m.mult}</span></div>
      <div class="hl">${esc(m.headline)}</div>
      <div class="sub meta">${m.source ? esc(m.source) + " · " : ""}${f.why ? tr(f.why) + " · " : ""}${tr("faltam {t}", { t: when(left) })}</div>${bar}${ad}</div>`;
  }).join("");
  el.innerHTML = head + (cards || `<div class="card sub">${tr("Nenhum sinal ativo. O servidor busca manchetes novas a cada poucos minutos; volte já já.")}</div>`);
}
