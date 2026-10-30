import { DAY, S, flag, now, save } from "./state.js";
import { tr } from "../lang.js";
import { bounce } from "../world/bounce.js";
import { gainXp, priceOf } from "./rpg-core.js";
export { priceOf };

// ---------- owned furniture: the run starts with a mattress, R2-DEBT on crates, a pocket radio and a basic kitchen/bathroom ----------
S.own = S.own || [];
S.bought = S.bought || {};
export const owns = k => S.own.includes(k);
// catalog sorted by room, like The Sims' buy mode
export const CATALOG = [
  { key: "desk", room: "Sala", name: "Escrivaninha com luminária", price: 80, desc: "Tira o R2-DEBT dos caixotes." },
  { key: "deskchair", room: "Sala", name: "Cadeira de trabalho", price: 30, desc: "O Dex para de trabalhar no chão." },
  { key: "tv", room: "Sala", name: "TV de tubo 14\"", price: 120, desc: "Ânimo e comerciais com bônus." },
  { key: "sofa", room: "Sala", name: "Sofá chesterfield", price: 150, desc: "Descanso, e lugar para ver TV." },
  { key: "armchair", room: "Sala", name: "Poltrona de couro", price: 90, desc: "Leitura: ânimo +10." },
  { key: "coffee", room: "Sala", name: "Mesa de centro", price: 40, desc: "Decoração." },
  { key: "rug", room: "Sala", name: "Tapete persa", price: 25, desc: "Decoração." },
  { key: "shelf", room: "Sala", name: "Estante de livros", price: 70, desc: "Livros. E talvez algo mais." },
  { key: "lamp", room: "Sala", name: "Abajur de pé", price: 35, desc: "Luz quente na sala." },
  { key: "records", room: "Sala", name: "Vitrola Hi-Fi", price: 220, desc: "Substitui o rádio de pilha." },
  { key: "clock", room: "Sala", name: "Relógio de parede", price: 20, desc: "Hora de Nova York." },
  { key: "cork", room: "Sala", name: "Mural de cortiça", price: 15, desc: "Para ligar os pontos." },
  { key: "ktable", room: "Cozinha", name: "Mesa e cadeira", price: 60, desc: "Ler o jornal com calma." },
  { key: "counter", room: "Cozinha", name: "Balcão com cafeteira", price: 45, desc: "Café: energia +8." },
  { key: "bed", room: "Quarto", name: "Cama", price: 160, desc: "Dorme mais rápido que no colchão." },
  { key: "nightstand", room: "Quarto", name: "Criado-mudo com despertador", price: 30, desc: "Luz de cabeceira." },
  { key: "wardrobe", room: "Quarto", name: "Guarda-roupa", price: 110, desc: "O que tem lá dentro?" },
  { key: "tub", room: "Banheiro", name: "Banheira de pés", price: 140, desc: "Higiene +60 de uma vez." },
  { key: "ticker", room: "Escritório", name: "Máquina de cotações", price: 200, desc: "A bolsa ao vivo, no escritório." },
  { key: "cabinets", room: "Escritório", name: "Arquivos de aço", price: 60, desc: "Crescem com a linha de Dados." },
  { key: "floppies", room: "Escritório", name: "Mesa de disquetes", price: 45, desc: "Crescem com o Software." },
  { key: "safe", room: "Escritório", name: "Cofre", price: 250, desc: "Pesado. Misterioso." },
];
for (const c of CATALOG) { c.name = tr(c.name); c.desc = tr(c.desc); c.room = tr(c.room); }
const catItem = k => CATALOG.find(c => c.key === k);
// The Sims-style depreciation: 25% off as soon as it's yours, then 5% a day, down to 40% of the price
export function sellValue(k) {
  const c = catItem(k), days = (now() - (S.bought[k] || now())) / DAY;
  return Math.round(c.price * Math.max(0.4, 0.75 - 0.05 * days));
}
export function buyItem(k) {
  const c = catItem(k);
  if (!c || owns(k) || S.usd < priceOf(c)) return false;
  S.usd -= priceOf(c); gainXp(10 + c.price / 8); S.own.push(k); S.bought[k] = now(); flag("furn"); save();
  if (typeof bounce === "function") bounce(k);
  return true;
}
export function sellItem(k) {
  if (!owns(k)) return 0;
  const v = sellValue(k); S.usd += v; S.own = S.own.filter(x => x !== k); delete S.bought[k];
  if (k === "tv") S.furn.tv = 0; if (k === "bed") S.furn.cama = 0;
  save(); return v;
}

// Furniture upgrades bought with cycles in the catalog; each tier changes the look in scene.js and an effect here.
export const FURN_UP = {
  pc:        { name: "Computador", tiers: ["R2-DEBT bege", "R2-DEBT Mk II com modem", "Workstation preta"], cost: [0, 400, 6000], fx: ["Hardware ×1", "Hardware ×1,5", "Hardware ×2,2"] },
  cama:      { name: "Cama", tiers: ["Cama simples", "Cama de casal", "Cama d'água"], cost: [0, 250, 3000], fx: ["Sono +5/s", "Sono +9/s", "Sono +15/s"] },
  geladeira: { name: "Geladeira", tiers: ["Usada, cor creme", "Frost-free", "Duplex cromada"], cost: [0, 150, 2000], fx: ["Refeição +40", "Refeição +60", "Refeição +90"] },
  tv:        { name: "TV", tiers: ["Tubo 14\" de madeira", "20\" com videocassete", "Console 29\" cromado"], cost: [0, 300, 4000], fx: ["Ânimo +25", "Ânimo +40, anúncio +0,5×", "Ânimo +60, anúncio +1×"] },
};
for (const f of Object.values(FURN_UP)) { f.name = tr(f.name); f.tiers = f.tiers.map(x => tr(x)); f.fx = f.fx.map(x => tr(x)); }
export const PC_MULT = [1, 1.5, 2.2], SLEEP_RATE = [5, 9, 15], MEAL = [40, 60, 90], TV_FUN = [25, 40, 60], AD_EXTRA = [0, 0.5, 1];
export function buyFurn(k) {
  const c = FURN_UP[k].cost[S.furn[k] + 1];
  if (c === undefined || S.usd < c) return false;
  S.usd -= c; gainXp(40); S.furn[k]++; save(); if (typeof bounce === "function") bounce(k);
  return true;
}

// The apartment is in New York: clocks and light follow NYC time. ?t=day|dusk|night overrides it for previewing.
