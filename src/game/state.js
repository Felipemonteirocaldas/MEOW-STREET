import { LANG, tr } from "../lang.js";

export const LINES = {
  // BDC is pegged to real BTC (≈ $0.80 each), so mining is slow on purpose: a level pays itself back in ~10 min
  hardware: { name: "Hardware", cost: 2,   prod: 0.004 },
  software: { name: "Software", cost: 15,  prod: 0.03 },
  dados:    { name: "Dados",    cost: 100, prod: 0.2 },
};
export const OFFLINE_CAP_S = 8 * 3600, DAY = 86400000, DEATH_DAYS = 7, EGG_TOTAL = 10;
for (const k in LINES) LINES[k].name = tr(LINES[k].name); // LANG/tr come from lang.js; news use native-language portals too
export const SAVE_KEY = "bd2"; // v2: the run starts in an empty apartment (old "bd" saves are left alone)
const hasSave = (() => { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } })();
// shortcut: uses device clock; swap for server time before launch (anti-cheat).
export const now = () => Date.now();

export let S = load();
function load() {
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s) return s; } catch (e) {}
  return { cycles: 0, last: now(), levels: { hardware: 0, software: 0, dados: 0 }, mods: {}, claimed: {} };
}
export const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// defaults for systems added after a save was created
S.needs = Object.assign({ fome: 80, energia: 80, diversao: 70, higiene: 80 }, S.needs);
S.furn = Object.assign({ pc: 0, cama: 0, geladeira: 0, tv: 0 }, S.furn);
S.trash = S.trash || [];
S.bills = S.bills || [];
S.eggs = S.eggs || {};
S.lastBill = S.lastBill || now() - DAY; // first bills arrive on day one
S.lastTrash = S.lastTrash || now();
S.lastSeen = S.lastSeen || now();
// Two currencies: R2-DEBT mines BDC (S.cycles); the real world (bills, furniture) wants dollars.
if (S.usd === undefined) S.usd = 50;
S.price = S.price || 0.5; // dollars per BDC
S.hist = S.hist || [];
if (S.doorLocked === undefined) S.doorLocked = true;
if (S.modsLang !== LANG) { S.mods = {}; S.modsLang = LANG; } // headlines from another language don't carry over
S.stat = Object.assign({ sales: 0, bills: 0, pets: 0 }, S.stat); // lifetime counters for the daily goals
S.cat = Object.assign({ aff: 10, hunger: 70, bowl: 0 }, S.cat); // Sombra, the black cat: affection, hunger, food in the bowl

// Dex can't be left alone too long: a week without the player ends the run.
export const awayMs = now() - S.lastSeen, awayDays = Math.floor(awayMs / DAY), gameOver = awayMs > DEATH_DAYS * DAY && !S.vacation; // on vacation (S.vacation) the case never ends
export const save = () => { if (gameOver) return; S.lastSeen = now(); try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} };
S.started = S.started || now();


// one-off milestones ("opened the PC", "paid a bill"...): feed the tutorial banner and the achievements
S.flags = S.flags || {};
export const flag = k => { if (!S.flags[k]) { S.flags[k] = now(); save(); } };
