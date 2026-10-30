import { S, flag, save } from "./state.js";
import { fee, gainXp, saleXp, sellBonus } from "./rpg-core.js";
import { fmt } from "./production.js";

// ---------- BDC market: the price is real BTC/USD ÷ 100,000, delivered by the server in worldstate.json ----------
export { fee } from "./rpg-core.js";
// Trading always costs a fee: churn loses money.
export function sellBDC(bdc) { bdc = Math.min(bdc, S.cycles); if (bdc <= 0) return 0; S.cycles -= bdc; const usd = bdc * S.price * (1 - fee()) * sellBonus(); S.usd += usd; gainXp(saleXp(usd)); flag("sold"); S.stat.sales++; save(); return usd; }
// buying keeps a 2% fee floor: the Golpe de mestre (no fee, +2%) must not become an arbitrage
export function buyBDC(usd) { usd = Math.min(usd, S.usd); if (usd <= 0) return 0; S.usd -= usd; const bdc = usd / S.price * (1 - Math.max(fee(), 0.02)); S.cycles += bdc; save(); return bdc; }
export const fmtUSD = n => "$" + (n < 1000 ? n.toFixed(2) : fmt(n));

