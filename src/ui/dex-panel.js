import { S, esc } from "../game/state.js";
import { ABILITIES, BRANCHES, LAB, MAXLVL, NODES, abilityLeft, abilityReady, addRank, buyLab, canRank, hasLab, levelBonus, onRpg, rank, respec, respecCost, spent, useAbility, xpFor } from "../game/rpg-core.js";
import { fmt } from "../game/production.js";
import { MIN_GAIN, MIN_LEVEL, PERKS, buyPerk, canReopen, gainPreview, legacyMult, perk, reopenCase } from "../game/prestige.js";
import { say } from "../characters/dex.js";
import { fmtUSD } from "../game/market.js";
import { toast } from "./overlays.js";
import { chirp } from "../audio/droid.js";
import { buzz } from "./haptics.js";
import { ico, IC } from "./icons.js";
import { tr } from "../lang.js";

// The "Dex" sheet: level and XP, active abilities, the three-branch talent tree (the build), the lab, and respec.
const el = document.getElementById("dexov"), box = document.getElementById("dexc");
let branch = "hacker", armed = 0; // armed: when the two-step 'Reabrir o caso' button was pressed
const mmss = ms => { const s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const need = n => { const t = [0, 3, 6, 9][n.tier]; return t > spent(n.b) ? tr("Requer {n} pontos em {b}", { n: t, b: tr(BRANCHES[n.b].name) }) : S.rpg.pts < 1 ? tr("Sem pontos") : ""; };
const dots = (r, max) => `<span class="dots">${Array.from({ length: max }, (_, i) => `<i class="${i < r ? "on" : ""}"></i>`).join("")}</span>`;

function node(n) {
  const r = rank(n.id), why = r >= n.max ? "" : need(n), can = canRank(n);
  return `<div class="tnode ${n.key ? "key" : ""} ${n.active ? "act" : ""} ${r ? "has" : ""}"><div class="tn-ic">${IC[n.active ? "energy" : n.key ? "trophy" : BRANCHES[n.b].icon]}</div>
    <div class="tn-b"><div class="tn-t"><b>${tr(n.name)}</b>${dots(r, n.max)}</div>
    <div class="tn-d">${r ? `<span class="now">${tr(n.desc(r))}</span>` : ""}${r < n.max && n.max > 1 ? `<span class="nxt">${r ? tr("Próximo") + ": " : ""}${tr(n.desc(r + 1))}</span>` : r === 0 ? `<span class="nxt">${tr(n.desc(1))}</span>` : ""}</div>
    ${why ? `<div class="tn-w">${why}</div>` : ""}</div>
    <button class="tn-btn" data-rank="${n.id}" ${can ? "" : "disabled"} aria-label="${tr("Evoluir")}">${r >= n.max ? "✓" : "+"}</button></div>`;
}

export function renderDex() {
  const R = S.rpg, nextXp = xpFor(R.lvl), pct = R.lvl >= MAXLVL ? 100 : Math.round(R.xp / nextXp * 100);
  const abil = Object.entries(ABILITIES).map(([id, a]) => {
    const have = rank(a.need) > 0, ready = abilityReady(id);
    return `<button class="abil ${ready ? "ready" : ""}" data-ab="${id}" ${ready ? "" : "disabled"}>${ico(a.icon)}<b>${tr(a.name)}</b><span data-cd="${id}">${have ? (ready ? tr("Pronta") : mmss(abilityLeft(id))) : tr("Bloqueada")}</span><em>${tr(a.desc)}</em></button>`;
  }).join("");
  const tabs = Object.entries(BRANCHES).map(([k, b]) => `<button class="${branch === k ? "on" : ""}" data-branch="${k}">${ico(b.icon)}${tr(b.name)} <em>${spent(k)}</em></button>`).join("");
  const lab = LAB.map(u => {
    const own = hasLab(u.id), locked = R.lvl < u.lvl, can = !own && !locked && S.cycles >= u.cost;
    return `<div class="lab ${own ? "own" : ""} ${locked ? "lock" : ""}"><div><b>${tr(u.name)}</b><span>${tr(u.desc)}</span></div>${own ? `<em>${tr("Instalado")}</em>` : locked ? `<em>${tr("Nível {n}", { n: u.lvl })}</em>` : `<button data-lab="${u.id}" ${can ? "" : "disabled"}>${fmt(u.cost)} BDC</button>`}</div>`;
  }).join("");

  const L = S.legacy, gain = gainPreview(), can = canReopen(), arm = Date.now() - armed < 6000;
  const perks = PERKS.map(p => { const r = perk(p.id), full = r >= p.max, c = full ? 0 : p.cost(r);
    return `<div class="lab ${full ? "own" : ""}"><div><b>${tr(p.name)} <span class="dots">${Array.from({ length: p.max }, (_, i) => `<i class="${i < r ? "on" : ""}"></i>`).join("")}</span></b><span>${tr(p.desc(Math.min(p.max, r + 1)).replace(/^/, ""))}</span></div>${full ? `<em>${tr("Máximo")}</em>` : `<button data-perk="${p.id}" ${L.points >= c ? "" : "disabled"}>${c} ${tr("Legado")}</button>`}</div>`; }).join("");
  const reopen = `<h3 class="dh3">${tr("Recomeço")} <span class="sub">${tr("reabrir o caso")}</span></h3>
    <div class="card hero"><div class="row"><div><div class="sub">${tr("Legado acumulado")}</div><div class="hn">${L.total} <span class="sub">· ×${legacyMult().toFixed(2)} ${tr("produção")}</span></div></div><div class="lv"><span>${tr("Pontos")}</span><b>${L.points}</b></div></div>
      <div class="sub">${tr("Você minerou {n} BDC neste caso. Se reabrir agora ganha {g} de Legado (+{p}% de produção para sempre).", { n: fmt(S.run.mined), g: gain, p: gain * 4 })}</div>
      <div class="sub">${tr("Reabrir zera dinheiro, BDC, linhas de produção, móveis e laboratório. Ficam: nível, talentos, pistas, conquistas e o Legado.")}</div>
      <button class="reopen ${arm ? "arm" : ""}" data-reopen ${can ? "" : "disabled"}>${can ? (arm ? tr("Toque de novo para confirmar") : tr("Reabrir o caso · +{g} Legado", { g: gain })) : tr("Disponível no nível {l} com {g} de Legado a ganhar", { l: MIN_LEVEL, g: MIN_GAIN })}</button></div>
    <h3 class="dh3">${tr("Herança")} <span class="sub">${tr("compre com Legado; vale em todo recomeço")}</span></h3><div class="labs">${perks}</div>`;
  box.innerHTML = `<div class="card hero"><div class="row"><div><div class="sub">${tr("Detetive falido")}</div><div class="hn">Dex Moreno</div></div><div class="lv"><span>${tr("Nível")}</span><b>${R.lvl}</b></div></div>
      <div class="xpbar"><i><b id="dx-xp" style="width:${pct}%"></b></i><span id="dx-xpt">${R.lvl >= MAXLVL ? tr("Nível máximo") : `${fmt(R.xp)} / ${fmt(nextXp)} XP`}</span></div>
      <div class="chips"><div class="chip ${R.pts ? "up" : ""}"><b>${R.pts}</b> <span>${tr("pontos de talento")}</span></div><div class="chip up"><b>×${levelBonus().toFixed(2)}</b> <span>${tr("produção pelo nível")}</span></div></div>
      <div class="sub">${tr("Ganhe XP vendendo BDC, pagando contas, achando pistas, comprando móveis e cuidando do Sombra. Cada nível dá 1 ponto de talento e +2% de produção.")}</div></div>
    <h3 class="dh3">${tr("Habilidades")}</h3><div class="abils">${abil}</div>
    <h3 class="dh3">${tr("Talentos")} <span class="sub">${tr("sua build")}</span></h3><div class="btabs">${tabs}</div><p class="sub">${tr(BRANCHES[branch].blurb)}</p>
    <div class="tree">${NODES.filter(n => n.b === branch).map(node).join("")}</div>
    <div class="respec"><button data-reset="${branch}" ${S.usd < respecCost(branch) ? "disabled" : ""}>${tr("Redistribuir {b}", { b: tr(BRANCHES[branch].name) })} · ${fmtUSD(respecCost(branch))}</button><button data-reset="all" ${S.usd < respecCost() ? "disabled" : ""}>${tr("Redistribuir tudo")} · ${fmtUSD(respecCost())}</button></div>
    <h3 class="dh3">${tr("Laboratório do R2-DEBT")} <span class="sub">${tr("melhorias únicas, pagas em BDC")}</span></h3><div class="labs">${lab}</div>${reopen}`;
}
// cooldown labels and the XP bar move every second without rebuilding the page (so a tap is never swallowed)
function tick() {
  const R = S.rpg, lv = document.getElementById("lvlbtn");
  if (lv) { lv.querySelector("b").textContent = "Lv " + R.lvl; lv.querySelector("i b").style.width = (R.lvl >= MAXLVL ? 100 : R.xp / xpFor(R.lvl) * 100) + "%"; lv.classList.toggle("pts", R.pts > 0); }
  if (el.hidden) return;
  for (const [id, a] of Object.entries(ABILITIES)) {
    const s = box.querySelector(`[data-cd="${id}"]`), b = box.querySelector(`[data-ab="${id}"]`); if (!s) continue;
    const have = rank(a.need) > 0, ready = abilityReady(id); s.textContent = have ? (ready ? tr("Pronta") : mmss(abilityLeft(id))) : tr("Bloqueada"); b.disabled = !ready; b.classList.toggle("ready", ready);
  }
  const x = box.querySelector("#dx-xp"); if (x) x.style.width = (R.lvl >= MAXLVL ? 100 : R.xp / xpFor(R.lvl) * 100) + "%";
}
setInterval(tick, 1000);

const open = () => { el.hidden = false; renderDex(); };
document.getElementById("dexbtn").addEventListener("click", open);
el.addEventListener("pointerdown", e => {
  const t = e.target;
  if (t === el || t.closest(".close")) return (el.hidden = true);
  const rk = t.closest("[data-rank]"), ab = t.closest("[data-ab]"), lb = t.closest("[data-lab]"), br = t.closest("[data-branch]"), rs = t.closest("[data-reset]"), pk = t.closest("[data-perk]"), ro = t.closest("[data-reopen]");
  if (br) { branch = br.dataset.branch; return renderDex(); }
  if (rk && !rk.disabled) { if (addRank(rk.dataset.rank)) { buzz(12); chirp(2); } return renderDex(); }
  if (ab && !ab.disabled) { if (useAbility(ab.dataset.ab)) toast("⚡ " + tr(ABILITIES[ab.dataset.ab].name)); return renderDex(); }
  if (lb && !lb.disabled) { if (buyLab(lb.dataset.lab)) toast(tr("Laboratório: melhoria instalada")); return renderDex(); }
  if (pk && !pk.disabled) { if (buyPerk(pk.dataset.perk)) toast(tr("Herança adquirida")); return renderDex(); }
  if (ro && !ro.disabled) {
    if (Date.now() - armed > 6000) { armed = Date.now(); renderDex(); return setTimeout(() => { if (!el.hidden) renderDex(); }, 6100); }
    if (reopenCase()) { toast(tr("Caso reaberto...")); return setTimeout(() => location.reload(), 900); }
  }
  if (rs && !rs.disabled) { if (respec(rs.dataset.reset === "all" ? undefined : rs.dataset.reset)) toast(tr("Pontos devolvidos")); return renderDex(); }
});
// header badge: tap to open
const badge = Object.assign(document.createElement("button"), { id: "lvlbtn", className: "lvl", type: "button" });
badge.innerHTML = "<b>Lv 1</b><i><b></b></i>"; badge.setAttribute("aria-label", "Dex");
document.querySelector("header .wallet").append(badge); badge.addEventListener("click", open); tick();

onRpg((type, data) => {
  if (type === "level") { toast("⭐ " + tr("Nível {n}! +1 ponto de talento", { n: data })); chirp(6); buzz([20, 40, 20]); }
  else if (type === "seventh") { toast("🐈‍⬛ " + tr("Sétima vida!")); }
  else if (type === "ability") { chirp(4); buzz(30); }
  if (!el.hidden) renderDex();
});

// back from a restart: a line and a toast, once
try { const g = localStorage.getItem("bd-reborn"); if (g) { localStorage.removeItem("bd-reborn"); setTimeout(() => { toast("📂 " + tr("Capítulo {n}", { n: S.legacy.runs + 1 })); say("Mesmo apartamento, mesmo colchão. Dessa vez eu sei o que esperar.", 7000); }, 3000); } } catch (e) {}
