import { EGG_TOTAL, S, flag, now, save } from "./state.js";
import { LINES } from "./state.js";
import { powerCut } from "./bills.js";
import { tr } from "../lang.js";
import { gainXp } from "./rpg-core.js";
import { fmt, totalRate } from "./production.js";
import { chirp } from "../audio/droid.js";
import { buzz } from "../ui/haptics.js";

// Achievements: data-driven, checked twice a second. S.ach = { id: unlock time }. Each test reads game state or a flag() milestone.
const eggs = () => Object.keys(S.eggs || {}).length;
export const ACHIEVEMENTS = [
  { id: "hire", name: "Primeira contratação", desc: "Compre o primeiro nível de produção.", test: () => Object.values(S.levels).some(v => v > 0) },
  { id: "news", name: "Leitor do mundo", desc: "Abra a aba Notícias.", test: () => S.flags.news },
  { id: "web", name: "Navegando na rede", desc: "Abra o navegador do PC.", test: () => S.flags.web },
  { id: "sold", name: "Caixa registradora", desc: "Venda BDC na Corretora pela primeira vez.", test: () => S.flags.sold },
  { id: "paid", name: "Em dia com a lei", desc: "Pague uma conta.", test: () => S.flags.paid },
  { id: "ai", name: "Conversa de bar", desc: "Converse 3 vezes com o Claudinho IA, a IA do PC.", test: () => S.flags.aichat },
  { id: "furn", name: "Lar, doce lar", desc: "Compre o primeiro móvel.", test: () => S.flags.furn },
  { id: "deco", name: "Decorador do 4B", desc: "Tenha 8 móveis comprados.", test: () => S.own.length >= 8 },
  { id: "upgrade", name: "Evolução do R2-DEBT", desc: "Melhore o computador.", test: () => S.furn.pc >= 1 },
  { id: "k", name: "Primeiros mil", desc: "Chegue a US$ 1.000 de patrimônio.", test: () => S.usd + S.cycles * S.price >= 1000 },
  { id: "cat", name: "Amigo do Sombra", desc: "Chegue a 80% de afeto com o gato.", test: () => S.cat.aff >= 80 },
  { id: "pet", name: "Fez as pazes", desc: "Faça carinho no Sombra.", test: () => S.flags.pet },
  { id: "roach", name: "Chinelada certeira", desc: "Acerte uma barata.", test: () => S.flags.roach },
  { id: "dark", name: "Noir de verdade", desc: "Fique sem luz por conta atrasada.", test: () => S.flags.blackout },
  { id: "mines", name: "Campo limpo", desc: "Vença o Campo Minado do PC.", test: () => S.flags.mines },
  { id: "holo", name: "Nossa única esperança", desc: "Abra o holograma no PC.", test: () => S.flags.holo },
  { id: "vac", name: "Férias merecidas", desc: "Tire férias em Pernambuco e volte ao 4B.", test: () => S.flags.vacation },
  { id: "again", name: "Capítulo 2", desc: "Reabra o caso pela primeira vez.", test: () => S.legacy.runs >= 1 },
  { id: "vet", name: "Veterano do 4B", desc: "Reabra o caso 3 vezes.", test: () => S.legacy.runs >= 3 },
  { id: "clues", name: "Investigador", desc: "Encontre 5 pistas.", test: () => eggs() >= 5 },
  { id: "case", name: "Caso encerrado", desc: "Encontre todas as {n} pistas.", test: () => eggs() >= EGG_TOTAL },
];
S.ach = S.ach || {};
// a card slides in at the top right, stacks if several unlock together and leaves by itself after 6 s (click to dismiss)
const stack = Object.assign(document.createElement("div"), { id: "achpop" });
document.body.append(stack);
// every 5th achievement is a milestone: XP that grows with the count, 5 min of production and a spare Mão do Dex
function milestone(n) {
  const xp = 100 * n, bdc = Math.max(5, totalRate() * 300);
  S.cycles += bdc; S.run.mined += bdc; S.poker.charges++; gainXp(xp);
  return `${tr("Marco")} ${n}: +${xp} XP · +${fmt(bdc)} BDC · +1 ${tr("Mão do Dex")}`;
}
function popAch(a, bonus) {
  const n = ACHIEVEMENTS.filter(x => S.ach[x.id]).length, card = Object.assign(document.createElement("div"), { className: "achcard" });
  card.innerHTML = `<i>🏆</i><div><small>${tr("Conquista desbloqueada")} · ${n}/${ACHIEVEMENTS.length}</small><b>${tr(a.name)}</b><span>${tr(a.desc, { n: EGG_TOTAL })} · +60 XP</span>${bonus ? `<em>${bonus}</em>` : ""}</div>`;
  if (bonus) card.classList.add("big");
  const bye = () => { card.classList.add("out"); setTimeout(() => card.remove(), 400); };
  card.addEventListener("click", bye); setTimeout(bye, 6000); stack.append(card);
}
export const unlocked = () => ACHIEVEMENTS.filter(a => S.ach[a.id]).length;
setInterval(() => {
  if (powerCut()) flag("blackout");
  for (const a of ACHIEVEMENTS) if (!S.ach[a.id] && a.test()) {
    S.ach[a.id] = now(); gainXp(60);
    const n = unlocked(), bonus = n % 5 === 0 ? milestone(n) : "";
    save(); popAch(a, bonus); chirp(bonus ? 9 : 5); buzz(bonus ? [40, 40, 80] : 40);
  }
}, 500);
