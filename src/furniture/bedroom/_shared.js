import { T, g } from "../../engine/draw.js";
import { S } from "../../game/state.js";
import { SKINS } from "../../characters/look.js";

export function sleeper([hx, hy]) { // Dex's head on the pillow + floating Zzz
  const u = T / 10;
  g.fillStyle = SKINS[S.look.skin]; g.beginPath(); g.arc(hx, hy, 1.8 * u, 0, 7); g.fill();
  if (S.look.hair !== 4) { g.fillStyle = S.look.hairCol; g.beginPath(); g.arc(hx - 0.6 * u, hy - 0.4 * u, 1.8 * u, Math.PI * 0.8, Math.PI * 1.9); g.fill(); }
  const k = (Date.now() / 1000) % 2; g.globalAlpha = 1 - k / 2; g.fillStyle = "#d8d4cc"; g.font = `700 ${T * 0.4}px serif`;
  g.fillText("z Z", hx + T * 0.2 + k * T * 0.3, hy - T * 0.4 - k * T * 0.5); g.globalAlpha = 1;
}
