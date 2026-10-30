import { DAY, S, flag, now, save } from "./state.js";
import { totalRate } from "./production.js";
import { billOf, gainXp } from "./rpg-core.js";

// ---------- bills: arrive daily under the door; overdue light bill cuts the power ----------
export const powerCut = () => S.bills.some(b => b.kind === "Luz" && now() > b.due);
export const rentLate = () => S.bills.some(b => b.kind === "Aluguel" && now() > b.due);
export function billsTick() {
  while (now() - S.lastBill >= DAY) {
    S.lastBill += DAY; S.billN = (S.billN || 0) + 1;
    const r = totalRate() * S.price, due = S.lastBill + 3 * DAY; // dollars per second the operation is worth; bills run ~8% of a day's income (rent is weekly)
    S.bills.push({ id: S.lastBill + 1, kind: "Luz", amount: billOf(4 + r * 86400 * 0.04 * (1 + S.furn.pc * 0.25)), due });
    S.bills.push({ id: S.lastBill + 2, kind: "Telefone", amount: billOf(2 + r * 86400 * 0.015), due });
    if (S.billN % 7 === 1) S.bills.push({ id: S.lastBill + 3, kind: "Aluguel", amount: billOf(25 + r * 86400 * 0.15), due });
  }
}
export function payBill(id) {
  const b = S.bills.find(x => x.id === id);
  if (!b || S.usd < b.amount) return false;
  S.usd -= b.amount; S.bills = S.bills.filter(x => x !== b); flag("paid"); S.stat.bills++; gainXp(20); save();
  return true;
}

