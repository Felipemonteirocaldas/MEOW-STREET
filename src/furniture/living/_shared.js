import { B, P, clamp100, pick } from "../../engine/draw.js";
import { zoomTo } from "../../engine/camera.js";
import { owns } from "../../game/catalog.js";
import { openRadio } from "../../ui/radio.js";
import { openPC } from "../../ui/pc.js";
import { busy, say } from "../../characters/dex.js";
import { S } from "../../game/state.js";

// magazine and a mug of coffee
export const ARM = y => [B(2.9, y, 0.95, 0.22, 0.5, "#2e211d"), B(2.88, y - 0.01, 0.99, 0.24, 0.08, "#3e2c27", 0.5)];
export function listen(auto) {
  if (!auto) return zoomTo(owns("records") ? P(0.4, 4.95, 0.6) : P(0.3, 5.0, 0.2), openRadio); // close-up, then the radio's face

  say("Vamos ver o que toca hoje..."); busy(6000, () => { S.needs.diversao = clamp100(S.needs.diversao + 12); });
} // cast-iron fins
export function work(auto) {
  // tapped by the player: zoom into the monitor and boot Meow OS 98; on his own he just works for a while
  if (!auto) return zoomTo(P(5.1, 0.6, 0.9), () => { openPC() || work(true); });
  say(pick(["Ao trabalho, R2-DEBT.", "Vamos ver o que o mundo está dizendo hoje."])); busy(20000, () => {}, "work");
}
