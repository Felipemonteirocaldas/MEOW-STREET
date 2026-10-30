import { S, now, save } from "./state.js";
import { perk } from "./prestige.js";

// Dex's RPG layer: level + XP, a three-branch talent tree (the "build"), three active abilities and a lab of one-time upgrades.
// Kept free of UI imports so economy modules can call it; the UI listens through onRpg().
export const MAXLVL = 25;
S.rpg = Object.assign({ xp: 0, lvl: 1, pts: 1, ranks: {}, lab: {}, cd: {}, until: {}, seventh: 0 }, S.rpg);
export const xpFor = L => Math.round(40 * Math.pow(1.38, L - 1));
export const rank = id => S.rpg.ranks[id] || 0;
export const hasLab = id => !!S.rpg.lab[id];

const listeners = [];
export const onRpg = fn => listeners.push(fn);
const emit = (type, data) => listeners.forEach(f => f(type, data));

export function gainXp(n) {
  if (S.rpg.lvl >= MAXLVL || !(n > 0)) return;
  S.rpg.xp += n * (hasLab("notebook") ? 1.15 : 1) * (1 + 0.1 * perk("mentor"));
  while (S.rpg.lvl < MAXLVL && S.rpg.xp >= xpFor(S.rpg.lvl)) {
    S.rpg.xp -= xpFor(S.rpg.lvl); S.rpg.lvl++; S.rpg.pts++; emit("level", S.rpg.lvl);
  }
  if (S.rpg.lvl >= MAXLVL) S.rpg.xp = 0;
}
setInterval(() => { if (!S.vacation) gainXp(1); }, 10000); // just being there counts

// ---------- the build ----------
// tier gates how many points you must already have in the branch: it forces you to commit to a path instead of sampling everything
export const BRANCHES = {
  hacker: { name: "Hacker", blurb: "Mais produção e notícias que trabalham a seu favor.", icon: "produce" },
  trader: { name: "Operador", blurb: "Taxas menores, preços melhores e faro para golpes.", icon: "exchange" },
  care: { name: "Cuidador", blurb: "Um Dex que aguenta mais e um Sombra que ama você.", icon: "cat" },
};
export const NODES = [
  { id: "overclock", b: "hacker", tier: 0, max: 3, name: "Overclock", desc: r => `+${8 * r}% de produção em todas as linhas` },
  { id: "amp", b: "hacker", tier: 0, max: 3, name: "Amplificador de sinal", desc: r => `Manchetes boas rendem +${20 * r}% a mais` },
  { id: "filtro", b: "hacker", tier: 1, max: 3, name: "Filtro anti-ruído", desc: r => `Manchetes ruins pesam ${20 * r}% menos` },
  { id: "core", b: "hacker", tier: 2, max: 1, key: true, name: "Núcleo quente", desc: () => "Hardware ×1,5, mas o Dex perde energia 25% mais rápido" },
  { id: "overdrive", b: "hacker", tier: 3, max: 1, active: "overclock", name: "Habilidade: Overclock!", desc: () => "Libera ×4 na produção por 45 s (recarga de 8 min)" },
  { id: "corretor", b: "trader", tier: 0, max: 3, name: "Corretor barato", desc: r => `Taxa de venda ${(0.5 * r).toFixed(1).replace(".", ",")} ponto menor (a compra nunca fica abaixo de 2%)` },
  { id: "negoc", b: "trader", tier: 0, max: 3, name: "Negociador", desc: r => `Móveis e contas ${4 * r}% mais baratos` },
  { id: "faro", b: "trader", tier: 1, max: 3, name: "Faro para golpes", desc: r => `Golpes do telefone pagam ${6 * r}% mais em média e a Mão de pôquer rende +${10 * r}%` },
  { id: "contra", b: "trader", tier: 2, max: 1, key: true, name: "Contrarian", desc: () => "+15% em toda venda quando o BDC caiu 0,5% ou mais na última hora" },
  { id: "master", b: "trader", tier: 3, max: 1, active: "insider", name: "Habilidade: Golpe de mestre", desc: () => "Vende 25% do seu BDC sem taxa e com +2% (recarga de 12 min)" },
  { id: "meta", b: "care", tier: 0, max: 3, name: "Metabolismo", desc: r => `As necessidades caem ${10 * r}% mais devagar` },
  { id: "pata", b: "care", tier: 0, max: 3, name: "Pata amiga", desc: r => `Carinho rende +${25 * r}% de afeto e o bônus do Sombra cresce ${25 * r}%` },
  { id: "ordem", b: "care", tier: 1, max: 3, name: "Casa em ordem", desc: r => `O lixo aparece ${20 * r}% mais devagar` },
  { id: "setima", b: "care", tier: 2, max: 1, key: true, name: "Sétima vida", desc: () => "Quando uma necessidade cai a 20% ou menos, ela volta a 60% (1 vez por hora). Salva você quando fica fora" },
  { id: "folego", b: "care", tier: 3, max: 1, active: "folego", name: "Habilidade: Fôlego", desc: () => "+45 em todas as necessidades, +5 de afeto e ×1,5 de produção por 60 s (recarga de 10 min)" },
];
const GATE = [0, 3, 6, 9]; // points needed in the branch to open each tier
export const spent = b => NODES.filter(n => n.b === b).reduce((t, n) => t + rank(n.id), 0);
export const totalSpent = () => NODES.reduce((t, n) => t + rank(n.id), 0);
export const canRank = n => S.rpg.pts > 0 && rank(n.id) < n.max && spent(n.b) >= GATE[n.tier];
export function addRank(id) { const n = NODES.find(x => x.id === id); if (!n || !canRank(n)) return false; S.rpg.ranks[id] = rank(id) + 1; S.rpg.pts--; save(); return true; }
export const respecCost = b => Math.round((b ? 15 : 40) * S.rpg.lvl);
export function respec(b) { // b: a branch id, or undefined for everything
  const cost = respecCost(b); if (S.usd < cost) return false;
  for (const n of NODES) if (!b || n.b === b) { S.rpg.pts += rank(n.id); delete S.rpg.ranks[n.id]; }
  S.usd -= cost; save(); return true;
}

// ---------- numbers the rest of the game asks for ----------
export const levelBonus = () => 1 + 0.02 * (S.rpg.lvl - 1);
export const talentMult = l => (1 + 0.08 * rank("overclock")) * (l === "hardware" && rank("core") ? 1.5 : 1);
export const tuneNews = v => v >= 1 ? 1 + (v - 1) * (1 + 0.2 * rank("amp") + (hasLab("antenna") ? 0.1 : 0)) : 1 - (1 - v) * (1 - 0.2 * rank("filtro"));
export const catBonus = () => 0.1 * (1 + 0.25 * rank("pata")) * (hasLab("collar") ? 1.5 : 1);
export const fee = () => Math.max(0.005, 0.03 - 0.005 * rank("corretor"));
export const priceOf = c => Math.round(c.price * (1 - 0.04 * rank("negoc")));
export const scamOdds = () => 0.85 + 0.06 * rank("faro"); // expected return of a scam call; the phone caps the win chance
export const needsDecay = k => (1 - 0.1 * rank("meta")) * (k === "energia" && rank("core") ? 1.25 : 1);
export const trashEvery = base => base * (1 + 0.2 * rank("ordem"));
export const petGain = base => base * (1 + 0.25 * rank("pata"));
export const blackoutMult = () => hasLab("nobreak") ? 0.6 : 0.3;
export const sellBonus = () => (rank("contra") && S.market && S.market.change1h <= -0.5 ? 1.15 : 1);
export const overclockOn = () => (S.rpg.until.overclock || 0) > now();
export const folegoOn = () => (S.rpg.until.folego || 0) > now();
export const abilityMult = () => (overclockOn() ? 4 : 1) * (folegoOn() ? 1.5 : 1);
// XP for a sale grows with the square root of the dollars, so churning the market is no shortcut to the level cap
export const saleXp = usd => Math.max(1, 2 * Math.sqrt(usd));
export const billOf = n => Math.round(n * (1 - 0.04 * rank("negoc")));
export function rescueNeeds() { // "Sétima vida"
  if (!rank("setima") || now() - S.rpg.seventh < 3600000) return;
  for (const k in S.needs) if (S.needs[k] <= 20) { S.needs[k] = 60; S.rpg.seventh = now(); emit("seventh", k); break; }
}

// ---------- lab: one-time upgrades bought with BDC ----------
export const LAB = [
  { id: "fan", name: "Ventoinha silenciosa", desc: "Hardware +10%", cost: 15, lvl: 1, line: "hardware", mult: 1.1 },
  { id: "notebook", name: "Caderno de anotações", desc: "+15% de XP em tudo", cost: 40, lvl: 2 },
  { id: "coffee", name: "Café forte do Dex", desc: "Todas as linhas +5%", cost: 60, lvl: 2, line: "all", mult: 1.05 },
  { id: "compiler", name: "Compilador otimizado", desc: "Software +10%", cost: 90, lvl: 3, line: "software", mult: 1.1 },
  { id: "paste", name: "Pasta térmica prateada", desc: "Hardware +15%", cost: 140, lvl: 4, line: "hardware", mult: 1.15 },
  { id: "index", name: "Índices de banco de dados", desc: "Dados +10%", cost: 220, lvl: 5, line: "dados", mult: 1.1 },
  { id: "collar", name: "Coleira reflexiva do Sombra", desc: "O bônus do gato cresce 50%", cost: 300, lvl: 6 },
  { id: "nobreak", name: "Nobreak de segunda mão", desc: "Sem luz, produz 60% em vez de 30%", cost: 500, lvl: 8 },
  { id: "antenna", name: "Antena de TV na janela", desc: "Manchetes boas +10% a mais", cost: 900, lvl: 10 },
  { id: "mobo", name: "Placa-mãe do R2-DEBT", desc: "Todas as linhas +15%", cost: 3000, lvl: 14, line: "all", mult: 1.15 },
];
export const labFactor = l => LAB.reduce((m, u) => m * (hasLab(u.id) && u.line && (u.line === "all" || u.line === l) ? u.mult : 1), 1);
export function buyLab(id) {
  const u = LAB.find(x => x.id === id);
  if (!u || hasLab(id) || S.rpg.lvl < u.lvl || S.cycles < u.cost) return false;
  S.cycles -= u.cost; S.rpg.lab[id] = now(); gainXp(8); save(); return true;
}

// ---------- active abilities ----------
export const ABILITIES = {
  overclock: { name: "Overclock!", icon: "produce", cd: 8 * 60000, need: "overdrive", desc: "×4 de produção por 45 s" },
  insider: { name: "Golpe de mestre", icon: "exchange", cd: 12 * 60000, need: "master", desc: "Vende 25% do BDC sem taxa, +2%" },
  folego: { name: "Fôlego", icon: "energy", cd: 10 * 60000, need: "folego", desc: "+45 nas necessidades, +5 de afeto, ×1,5 de produção por 60 s" },
};
export const abilityReady = id => rank(ABILITIES[id].need) > 0 && now() >= (S.rpg.cd[id] || 0);
export const abilityLeft = id => Math.max(0, (S.rpg.cd[id] || 0) - now());
export function useAbility(id) {
  if (!abilityReady(id)) return false;
  S.rpg.cd[id] = now() + ABILITIES[id].cd;
  if (id === "overclock") S.rpg.until.overclock = now() + 45000;
  else if (id === "folego") { for (const k in S.needs) S.needs[k] = Math.min(100, S.needs[k] + 45); S.cat.aff = Math.min(100, S.cat.aff + 5); S.rpg.until.folego = now() + 60000; }
  else if (id === "insider") { const bdc = S.cycles * 0.25; S.cycles -= bdc; S.usd += bdc * S.price * 1.02; gainXp(saleXp(bdc * S.price)); }
  save(); emit("ability", id); return true;
}
