import { activeMods } from "../game/production.js";
import { nyc } from "../game/clock.js";
import { LOCALE, tr } from "../lang.js";
import { LINES, esc } from "../game/state.js";

// newspaper: today's real headlines, printed in 1986
const paperEl = document.getElementById("paper"), paperc = document.getElementById("paperc");
export function openPaper() {
  const ms = activeMods(), news = ms.filter(m => !m.sponsored).sort((a, b) => Math.abs(b.mult - 1) - Math.abs(a.mult - 1)), ad = ms.find(m => m.sponsored);
  const date = nyc().toLocaleDateString(LOCALE, { weekday: "long", day: "numeric", month: "long" }) + tr(" de 1986");
  const tip = m => `<span class="${m.mult >= 1 ? "up" : "down"}">${m.mult >= 1 ? "▲" : "▼"} ${LINES[m.line].name} ${tr(m.mult >= 1 ? "em alta" : "em baixa")}</span>`;
  paperc.innerHTML = `<div class="mast">The New York Signal</div><div class="dateline">${tr("{date} · 25 centavos", { date })}</div>
    ${news[0] ? `<h3 class="lead">${esc(news[0].headline)}</h3><p class="tip">${tip(news[0])}</p>` : `<p>${tr("Edição sem manchetes.")}</p>`}
    <div class="cols">${news.slice(1).map(m => `<div><h4>${esc(m.headline)}</h4><p class="tip">${tip(m)}</p></div>`).join("")}
    ${ad ? `<div class="classified"><b>${tr("ANÚNCIO")}</b><br>${esc(ad.advertiser)}: ${esc(ad.headline)}</div>` : ""}</div>`;
  paperEl.hidden = false;
}
paperEl.addEventListener("click", e => { if (!e.target.closest(".news-paper")) paperEl.hidden = true; });

