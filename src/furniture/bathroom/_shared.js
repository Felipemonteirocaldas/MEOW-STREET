import { S, save } from "../../game/state.js";
import { say } from "../../characters/dex.js";

export const wc = { pee: false, last: 0 }; // visit mode (decided when he picks his spot) and when he last went
export let flushUntil = 0;
export function flush(line) { S.poo = false; flushUntil = Date.now() + 1500; say(line); save(); }
