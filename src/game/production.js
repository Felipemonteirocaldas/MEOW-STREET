import { LINES, OFFLINE_CAP_S, S, SAVE_KEY, awayDays, awayMs, gameOver, now, save } from "./state.js";
import { decayNeeds, needsMult } from "./needs.js";
import { AD_EXTRA, PC_MULT } from "./catalog.js";
import { billsTick, powerCut } from "./bills.js";
import { trashTick } from "./mess.js";
import { LANG, tr } from "../lang.js";
import { legacyMult } from "./prestige.js";
import { abilityMult, blackoutMult, catBonus, labFactor, levelBonus, overclockOn, talentMult, tuneNews, gainXp } from "./rpg-core.js";
import { marketEvent } from "../ui/exchange.js";
import { renderNews } from "../ui/news-panel.js";

export const activeMods = () => Object.values(S.mods).filter(m => m.until > now());
// Sombra: a cat that likes you brings luck (+10% at full affection); a starving one costs you 5%
export const catMult = () => 1 + Math.min(S.cat.aff, 100) / 100 * catBonus() - (S.cat.hunger <= 0 ? 0.05 : 0);
// every factor scaling a line, so the production panel can show *why* the number is what it is
export function lineBreakdown(l) {
  const out = activeMods().filter(m => m.line === l).map(m => ({ kind: "news", value: tuneNews(m.mult), mod: m }));
  if (S.bonus && S.bonus.until > now() && S.bonus.line === l) out.push({ kind: "ad", value: S.bonus.mult, until: S.bonus.until });
  out.push({ kind: "dex", value: needsMult() }, { kind: "cat", value: catMult() }, { kind: "lvl", value: levelBonus() }, { kind: "legacy", value: legacyMult() }, { kind: "build", value: talentMult(l) }, { kind: "lab", value: labFactor(l) });
  if (abilityMult() > 1) out.push({ kind: "ability", value: abilityMult() });
  if (l === "hardware") out.push({ kind: "pc", value: PC_MULT[S.furn.pc] });
  if (powerCut()) out.push({ kind: "power", value: blackoutMult() });
  return out;
}
export const lineMult = l => lineBreakdown(l).reduce((a, f) => a * f.value, 1);
export const lineRate = l => LINES[l].prod * S.levels[l] * lineMult(l);
export const totalRate = () => Object.keys(LINES).reduce((a, l) => a + lineRate(l), 0);
export const cost = l => Math.ceil(LINES[l].cost * Math.pow(1.15, S.levels[l]));
export const fmt = n => n < 1e3 ? n.toFixed(n < 1 ? 3 : n < 10 ? 2 : n < 100 ? 1 : 0) : n < 1e6 ? (n / 1e3).toFixed(2) + "K" : (n / 1e6).toFixed(2) + "M";

export function newGame() { try { localStorage.removeItem(SAVE_KEY); localStorage.setItem("bd-intro", "1"); } catch (e) {} location.reload(); }
document.getElementById("newcase").addEventListener("click", newGame);

export async function fetchWorld() {
  try {
    const w = await (await fetch(`worldstate.json?lang=${LANG}&t=${now()}`, { cache: "no-store" })).json();
    for (const m of w.mods) {
      if (!S.mods[m.id]) S.mods[m.id] = { ...m, until: now() + m.dur_min * 60000 };
    }
    for (const id in S.mods) if (S.mods[id].until < now()) delete S.mods[id];
    if (w.market) {
      Object.assign(S, { price: w.market.bdc, hist: w.market.hist, market: w.market });
      const ch = w.market.change1h; // a real ±3% hour on BTC is a market event in the game
      if (Math.abs(ch) >= 3 && now() - (S.lastEvent || 0) > 3600000) { S.lastEvent = now(); if (typeof marketEvent === "function") marketEvent(ch < 0 ? "crash" : "pump", ch); }
    }
    if (w.weather && S.weatherSrc !== "geo") S.weather = w.weather; // the player's own weather (weather.js) wins over the server's NYC
    renderNews();
  } catch (e) { /* offline: keep last known state */ }
}

// Called by the TV in scene.js after the sponsored spot finishes.
export function claimAd(id) {
  const m = S.mods[id];
  if (!m || S.claimed[id]) return;
  S.claimed[id] = true;
  S.bonus = { line: m.line, mult: m.reward.mult + AD_EXTRA[S.furn.tv], until: now() + m.reward.dur_min * 60000 };
  gainXp(25); save(); renderNews();
}


