import { OFFLINE_CAP_S, S, awayDays, awayMs, gameOver, now } from "./state.js";
import { totalRate } from "./production.js";
import { decayNeeds } from "./needs.js";
import { billsTick } from "./bills.js";
import { trashTick } from "./mess.js";

// start-up: runs once, after every module is loaded (it needs bills, needs, mess, ...)
// offline progress (simple: current rate over elapsed time, capped)
if (!gameOver && !S.vacation) { // on vacation the game is paused: nothing mined, no bills (ui/vacation.js shifts the clocks on return)
  const away = Math.min((now() - S.last) / 1000, OFFLINE_CAP_S);
  if (away > 5) { S.cycles += totalRate() * away; S.run.mined += totalRate() * away; decayNeeds(away, 20); S.cat.hunger = Math.max(10, S.cat.hunger - away * 0.008); } // absence never drops needs below 20
  billsTick(); trashTick();
  // an unlocked door and a long absence: someone came in
  if (!S.doorLocked && awayMs > 2 * 3600000 && S.usd > 1) { S.burgled = S.usd * 0.3; S.usd -= S.burgled; }
}
S.last = now();

if (gameOver) {
  document.getElementById("gameover").hidden = false;
  document.getElementById("goDays").textContent = awayDays;
}
