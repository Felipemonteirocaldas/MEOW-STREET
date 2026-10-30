import { DAY, S, now, save } from "./state.js";

// Recomeço ("Reabrir o caso"): trade the apartment, the money and the production lines for Legado, a permanent boost.
// What resets: dollars, BDC, production levels, furniture, upgrades, bills, mess, the lab. What stays: Dex's level and talents,
// clues, achievements, the tutorial, settings. Legado = sqrt(BDC mined this run / 50); each point banked is +4% production forever.
// Kept free of other game imports (rpg-core and production read it).
S.legacy = Object.assign({ points: 0, total: 0, runs: 0, perks: {} }, S.legacy);
S.run = Object.assign({ mined: 0, start: now() }, S.run);

export const perk = id => S.legacy.perks[id] || 0;
export const legacyMult = () => 1 + 0.04 * S.legacy.total;
export const gainPreview = () => Math.floor(Math.sqrt(S.run.mined / 50));
export const MIN_LEVEL = 8, MIN_GAIN = 10; // ~5,000 BDC mined: reopening early and often must not beat a long run by much
export const canReopen = () => S.rpg.lvl >= MIN_LEVEL && gainPreview() >= MIN_GAIN;

export const PERKS = [
  { id: "fund", name: "Fundo de emergência", max: 3, cost: r => 2 * (r + 1), desc: r => `Cada recomeço começa com +US$ ${100 * r}` },
  { id: "salary", name: "Primeiro salário", max: 3, cost: r => 2 * (r + 1), desc: r => `Cada recomeço começa com ${[0, 30, 90, 200][r]} BDC` },
  { id: "mentor", name: "Lições da vida", max: 3, cost: r => 3 * (r + 1), desc: r => `+${10 * r}% de XP em tudo` },
  { id: "legend", name: "Sombra lendário", max: 3, cost: r => 2 * (r + 1), desc: r => `O Sombra já começa com ${10 + 20 * r}% de afeto` },
  { id: "innate", name: "Talento inato", max: 3, cost: r => 4 * (r + 1), desc: r => `+${r} ponto${r > 1 ? "s" : ""} de talento permanente${r > 1 ? "s" : ""}` },
];
export function buyPerk(id) {
  const p = PERKS.find(x => x.id === id), r = perk(id);
  if (!p || r >= p.max || S.legacy.points < p.cost(r)) return false;
  S.legacy.points -= p.cost(r); S.legacy.perks[id] = r + 1;
  if (id === "innate") S.rpg.pts++; // the talent point is granted once, when bought
  save(); return true;
}

export function reopenCase() {
  if (!canReopen()) return false;
  const gain = gainPreview();
  S.legacy.points += gain; S.legacy.total += gain; S.legacy.runs++;
  S.cycles = perk("salary") ? [0, 30, 90, 200][perk("salary")] : 0; S.usd = 50 + 100 * perk("fund");
  S.levels = { hardware: 0, software: 0, dados: 0 };
  S.own = []; S.bought = {}; S.furn = { pc: 0, cama: 0, geladeira: 0, tv: 0 };
  S.trash = []; S.bills = []; S.deals = []; S.poo = false; S.bonus = null; S.burgled = 0; S.doorLocked = true;
  S.lastBill = now() - DAY; S.lastTrash = now(); S.last = now();
  S.needs = { fome: 80, energia: 80, diversao: 70, higiene: 80 };
  S.cat = { aff: 10 + 20 * perk("legend"), hunger: 70, bowl: 0 };
  S.rpg.lab = {}; S.rpg.cd = {}; S.rpg.until = {};
  S.run = { mined: 0, start: now() };
  save();
  try { localStorage.setItem("bd-reborn", String(gain)); } catch (e) {}
  return true;
}
