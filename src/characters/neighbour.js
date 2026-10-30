import { S, gameOver } from "../game/state.js";
import { overlayOpen, toast } from "../ui/overlays.js";
import { OPTS } from "../menu.js";
import { dayPhase } from "../game/clock.js";
import { shake } from "./roach.js";
import { react } from "./reactions.js";
import { pick } from "../engine/draw.js";

// the neighbour in 4A bangs on the wall when the radio is loud at night; the cat Dex doesn't have knocks things over
setInterval(() => {
  if (gameOver || S.vacation || overlayOpen()) return;
  if (S.radio && OPTS.volume >= 0.7 && dayPhase() !== "day" && Math.random() < 0.3) {
    shake(Date.now() + 700); toast("TUM! TUM! TUM!");
    react("neighbour");
  }
}, 60000);

