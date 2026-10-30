// Video poker (Jacks or Better) with no bet: Dex deals himself a hand every few minutes. Pure functions, no imports.
export const HANDS = ["Nada", "Par de valetes ou melhor", "Dois pares", "Trinca", "Sequência", "Flush", "Full house", "Quadra", "Straight flush", "Royal flush"];
export const PAY = [0, 1, 2, 3, 4, 6, 9, 25, 50, 800]; // the classic 9/6 paytable: ~99.5% return per hand, so the average hand is worth about one unit
export const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
// card n: rank n % 13 (0 = deuce ... 12 = ace), suit floor(n / 13)
export function evaluate(cards) {
  const r = cards.map(c => c % 13).sort((a, b) => a - b), n = {};
  r.forEach(x => n[x] = (n[x] || 0) + 1);
  const by = Object.values(n).sort((a, b) => b - a), flush = cards.every(c => Math.floor(c / 13) === Math.floor(cards[0] / 13));
  const straight = by[0] === 1 && (r[4] - r[0] === 4 || r.join() === "0,1,2,3,12");
  if (straight && flush) return r.join() === "8,9,10,11,12" ? 9 : 8;
  if (by[0] === 4) return 7;
  if (by[0] === 3 && by[1] === 2) return 6;
  if (flush) return 5;
  if (straight) return 4;
  if (by[0] === 3) return 3;
  if (by[0] === 2 && by[1] === 2) return 2;
  if (by[0] === 2 && Object.keys(n).some(k => n[k] === 2 && +k >= 9)) return 1;
  return 0;
}

// Near miss: the final hand is one card away from a better one. Returns the index of that hand (4 straight, 5 flush, 8 straight flush, 9 royal) or -1.
const run = r => { const u = [...new Set(r)].sort((a, b) => a - b); return u.length === 5 && (u[4] - u[0] === 4 || u.join() === "0,1,2,3,12"); };
const gap = r => Array.from({ length: 13 }, (_, x) => x).some(x => run([...r, x]));
export function nearMiss(cards) {
  const k = evaluate(cards), suit = c => Math.floor(c / 13);
  for (let s = 0; s < 4; s++) {
    const m = cards.filter(c => suit(c) === s).map(c => c % 13);
    if (m.length !== 4 || k >= 5) continue;
    if (m.every(x => x >= 8)) return 9;
    return gap(m) ? 8 : 5;
  }
  return k < 4 && new Set(cards.map(c => c % 13)).size === 5 && cards.some((_, i) => gap(cards.filter((__, j) => j !== i).map(c => c % 13))) ? 4 : -1;
}
