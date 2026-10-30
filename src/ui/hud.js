import { S, EGG_TOTAL } from "../game/state.js";
import { needsMult } from "../game/needs.js";
import { powerCut } from "../game/bills.js";
import { CATALOG, owns } from "../game/catalog.js";
import { activeMods, cost } from "../game/production.js";
import { LINES } from "../game/state.js";
import { tr } from "../lang.js";
import { IC, ico } from "./icons.js";
import { openBills } from "./bills.js";
import { openPoker } from "./poker.js";
import { dailyGoals } from "../game/daily.js";

// The bottom HUD: Dex's four needs as icon cards, status chips (mood, Sombra, clues, mail), and a tab bar with icons and alert dots.
const needsEl = document.getElementById("needs");
const NEEDS = [["fome", "food", "Comida"], ["energia", "energy", "Energia"], ["diversao", "mood", "Ânimo"], ["higiene", "hygiene", "Higiene"]];
const owed = () => S.bills.reduce((t, b) => t + b.amount, 0);

// build the structure once; every tick only touches text and widths, so taps are never swallowed by a re-render
needsEl.innerHTML = `<div class="need-row">${NEEDS.map(([k, ic, label]) => `<div class="need" data-n="${k}">${ico(ic)}<div class="nb"><div class="nt"><span>${tr(label)}</span><b>0%</b></div><i><b></b></i></div></div>`).join("")}</div><div class="chip-row"></div>`;
const chipRow = needsEl.querySelector(".chip-row"), needEls = Object.fromEntries(NEEDS.map(([k]) => [k, needsEl.querySelector(`[data-n="${k}"]`)]));

// tab bar: icon over label, with a badge or dot per tab
const TABS = { dexbtn: "dex", prodbtn: "produce", newsbtn: "news", exchbtn: "exchange", shopbtn: "shop" };
for (const [id, name] of Object.entries(TABS)) { const b = document.getElementById(id); b.innerHTML = `${ico(name)}<span class="lb">${b.textContent.trim()}</span><em class="dot" hidden></em>`; }
document.getElementById("pausebtn").innerHTML = IC.menu;

const chip = (cls, iconName, text, extra = "") => `<span class="hchip ${cls}" ${extra}>${IC[iconName]}<span>${text}</span></span>`;
const badge = (id, v, red) => { const d = document.querySelector(`#${id} .dot`); d.hidden = !v; d.textContent = typeof v === "number" ? v : ""; d.classList.toggle("red", !!red); d.classList.toggle("num", typeof v === "number"); };

export function renderHud() {
  for (const [k] of NEEDS) {
    const v = Math.round(S.needs[k]), el = needEls[k];
    el.querySelector("b").textContent = v + "%"; el.querySelector("i b").style.width = v + "%"; el.classList.toggle("low", v < 30); el.classList.toggle("ok", v >= 70);
  }
  const mult = needsMult(), hearts = Math.max(1, Math.ceil(S.cat.aff / 20)), bills = S.bills.length, cut = powerCut();
  const html = [
    chip(mult >= 1.05 ? "up" : mult < 0.95 ? "down" : "", "mood", `×${mult.toFixed(2)}`, `title="${tr("Disposição do Dex: multiplica a produção")}"`),
    chip(S.cat.hunger < 25 ? "down" : "", "cat", "♥".repeat(hearts) + (S.cat.hunger < 25 ? " " + tr("com fome") : ""), `title="${tr("Sombra")}"`),
    chip("", "clue", `${Object.keys(S.eggs).length}/${EGG_TOTAL}`, `title="${tr("Pistas")}"`),
    cut ? chip("down", "power", tr("Sem luz"), 'data-bills="1"') : bills ? chip("warn", "mail", `${bills} ${tr(bills === 1 ? "conta" : "contas")}`, 'data-bills="1"') : "",
    S.poker.charges ? chip("up", "trophy", `${tr("Mão")} ×${S.poker.charges}`, `data-poker="1" title="${tr("Mão do Dex")}"`) : "",
    chip(dailyGoals().every(g => g.done) ? "up" : "", "produce", `${dailyGoals().filter(g => g.done).length}/3`, `title="${tr("Meta do dia")}"`),
    S.trash.length >= 6 ? chip("warn", "trash", tr("Sujeira")) : "",
  ].join("");
  if (chipRow.dataset.k !== html) { chipRow.dataset.k = html; chipRow.innerHTML = html; }
  // alerts on the tabs
  badge("dexbtn", S.rpg.pts > 0 ? "•" : 0);
  badge("prodbtn", Object.keys(LINES).some(l => cost(l) <= S.cycles) ? "•" : 0);
  badge("newsbtn", activeMods().filter(m => !m.sponsored).length);
  badge("exchbtn", bills && owed() > S.usd ? "!" : 0, true);
  badge("shopbtn", CATALOG.some(c => !owns(c.key) && c.price <= S.usd) ? "•" : 0);
}
chipRow.addEventListener("click", e => { if (e.target.closest("[data-bills]")) openBills(); if (e.target.closest("[data-poker]")) openPoker(); });
renderHud();
