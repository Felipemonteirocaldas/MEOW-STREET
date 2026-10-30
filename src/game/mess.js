import { S, now } from "./state.js";
import { trashEvery } from "./rpg-core.js";

// ---------- mess: a piece of trash shows up every 15 min (spot indices map to places in scene.js) ----------
const TRASH_N = 14, TRASH_EVERY = 15 * 60000;
export function trashTick() {
  while (now() - S.lastTrash >= trashEvery(TRASH_EVERY)) {
    S.lastTrash += trashEvery(TRASH_EVERY);
    const free = [...Array(TRASH_N).keys()].filter(i => !S.trash.includes(i));
    if (free.length && S.trash.length < 10) S.trash.push(free[Math.floor(Math.random() * free.length)]);
  }
}

