import { S, now, save } from "./state.js";
import { totalRate } from "./production.js";
import { gainXp, rank } from "./rpg-core.js";
import { PAY, evaluate, shuffle } from "./poker-hand.js";

// "Mão do Dex": a free video-poker hand every 6 min, banked up to 3 so being away never wastes it. The prize is
// minutes of production (BDC), so it stays relevant at every stage; the hand in progress is saved so a reload can't reroll it.
export const EVERY = 6 * 60000, MAX = 3, UNIT_S = 30;
S.poker = Object.assign({ charges: 1, next: now() + EVERY, hands: 0, best: 0, hand: null }, S.poker);
export function pokerTick() {
  const p = S.poker;
  if (S.vacation) return;
  if (p.charges >= MAX) { p.next = now() + EVERY; return; }
  while (now() >= p.next && p.charges < MAX) { p.charges++; p.next += EVERY; }
}
pokerTick(); setInterval(pokerTick, 1000);

export function deal() {
  const p = S.poker; if (p.hand || p.charges < 1) return null;
  p.charges--; const d = shuffle([...Array(52).keys()]);
  p.hand = { cards: d.slice(0, 5), deck: d.slice(5) }; save(); return p.hand.cards;
}
export function draw(held) { // held: five booleans; the rest are replaced from the saved deck
  const p = S.poker, h = p.hand; if (!h) return null;
  const cards = h.cards.map((c, i) => held[i] ? c : h.deck.pop()), k = evaluate(cards), units = PAY[k];
  const bdc = units * Math.max(0.5, totalRate() * UNIT_S) * (1 + 0.1 * rank("faro"));
  S.cycles += bdc; S.run.mined += bdc; gainXp(units ? 2 + units * 3 : 1);
  p.hands++; p.best = Math.max(p.best, k); p.hand = null; save();
  return { cards, k, bdc };
}
