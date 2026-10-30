import { S, now, save } from "./state.js";
import { totalRate } from "./production.js";
import { gainXp } from "./rpg-core.js";
import "./poker.js"; // S.poker must exist before the goals read it
import { toast } from "../ui/overlays.js";
import { chirp } from "../audio/droid.js";

// "Meta do dia": three light goals that renew at local midnight. Missing them costs nothing; finishing each gives XP, finishing all three
// gives a spare Mão do Dex. Progress is a delta against a snapshot taken when the goals were drawn, so it follows every economy stage.
const POOL = [
  { id: "mine", name: "Minerar {n} BDC", n: () => Math.max(20, Math.round(totalRate() * 1800)), val: () => S.run.mined },
  { id: "sell", name: "Vender BDC na Corretora", n: () => 1, val: () => S.stat.sales },
  { id: "bill", name: "Pagar uma conta", n: () => 1, val: () => S.stat.bills },
  { id: "poker", name: "Jogar {n} mãos de pôquer", n: () => 2, val: () => S.poker.hands },
  { id: "pet", name: "Fazer carinho no Sombra {n} vezes", n: () => 3, val: () => S.stat.pets },
];
const today = () => Math.floor((now() - new Date().getTimezoneOffset() * 60000) / 864e5);
function draw() {
  const d = today(), ids = [0, 1, 2].map(i => POOL[(d + i) % POOL.length]);
  S.daily = { day: d, g: ids.map(g => ({ id: g.id, need: g.n(), base: g.val(), done: false })) };
  save();
}
if (!S.daily) draw();
export const dailyGoals = () => S.daily.g.map(x => {
  const def = POOL.find(p => p.id === x.id), have = Math.max(0, def.val() - x.base);
  return { name: def.name, need: x.need, have: Math.min(have, x.need), done: x.done };
});
function check() {
  if (S.daily.day !== today()) draw();
  S.daily.g.forEach((x, i) => {
    const def = POOL.find(p => p.id === x.id), v = def.val();
    if (v < x.base) x.base = v; // a new run reset the counter
    if (x.done || v - x.base < x.need) return;
    x.done = true; gainXp(40); chirp(3); toast(`🎯 ${def.name.replace("{n}", x.need)} ✓ +40 XP`);
    if (S.daily.g.every(y => y.done)) { S.poker.charges++; toast("🎯 Metas do dia completas! +1 Mão do Dex"); }
    save();
  });
}
setInterval(check, 1000);
