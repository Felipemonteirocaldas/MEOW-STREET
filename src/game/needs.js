import { EGG_TOTAL, S } from "./state.js";
import { powerCut, rentLate } from "./bills.js";
import { tr } from "../lang.js";
import { needsDecay, rescueNeeds } from "./rpg-core.js";

// ---------- needs: they scale production (0.85..1.25) ----------
const DECAY = { fome: 0.02, energia: 0.013, diversao: 0.017, higiene: 0.012 }; // points per second
export function decayNeeds(sec, floor = 0) {
  for (const k in DECAY) {
    const m = k === "diversao" ? (1 + (S.trash.length + (S.poo ? 3 : 0)) / 6) * (rentLate() ? 2 : 1) : 1; // mess (and an unflushed toilet) and late rent wear him down
    S.needs[k] = Math.max(Math.min(S.needs[k], floor), S.needs[k] - DECAY[k] * m * needsDecay(k) * sec);
  }
  rescueNeeds();
}
export const needsMult = () => 0.85 + 0.4 * (S.needs.fome + S.needs.energia + S.needs.diversao + S.needs.higiene) / 400;

// mods: id -> {line, mult, until, headline, faction, sponsored?, advertiser?, reward?}
