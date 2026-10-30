import { gainXp } from "../game/rpg-core.js";
import { B, faceY, g, tier } from "../engine/draw.js";
import { powerCut } from "../game/bills.js";
import { fmt, totalRate } from "../game/production.js";
import { S, save } from "../game/state.js";
import { toast } from "../ui/overlays.js";
import { say } from "../characters/dex.js";

// ---------- furniture ----------
export const TVB = (t = tier("tv")) => [
  [B(0.05, 2, 0.75, 1.3, 0.5, "#3a2c22"), B(0.1, 2.1, 0.65, 1.05, 0.75, "#4a3a2e", 0.5)],
  [B(0.05, 1.95, 0.8, 1.4, 0.5, "#2a2a2e"), B(0.12, 2.05, 0.62, 0.9, 0.12, "#1b1b1f", 0.5), B(0.08, 2.05, 0.7, 1.15, 0.85, "#161618", 0.62)],
  [B(0.05, 1.85, 0.85, 1.6, 1.5, "#9ea3ab")],
][t];
// R2-DEBT itself (case, monitor, keyboard, modem), standing on whatever surface is at height z
export const pcBoxes = (t, z) => {
  const skin = t === 2 ? "#26282e" : "#cdc6b4", b = [
    B(4.15, 0.12, 1.1, 0.6, 0.16, skin, z), B(4.3, 0.15, 0.8, 0.5, 0.55, skin, z + 0.16), B(4.25, 0.75, 0.9, 0.15, 0.04, "#9a958a", z)];
  if (t >= 1) b.push(B(5.3, 0.58, 0.4, 0.22, 0.07, "#111113", z)); // modem
  return b;
};
export const DESKB = (t = tier("pc")) => [B(4.0, 0.05, 1.8, 0.9, 0.75, "#2a211b"), ...pcBoxes(t, 0.75),
  B(5.4, 0.25, 0.12, 0.12, 0.35, "#1b1b1f", 0.75), B(5.3, 0.18, 0.32, 0.26, 0.1, "#2f5a43", 1.1)]; // + banker's lamp
export const CRATESB = (t = tier("pc")) => [B(4.1, 0.1, 0.6, 0.7, 0.5, "#6b5a3a"), B(5.1, 0.1, 0.6, 0.7, 0.5, "#6b5a3a"),
  B(4.0, 0.05, 1.8, 0.9, 0.06, "#7a6440", 0.5), ...pcBoxes(t, 0.56)]; // a plank over two fruit crates
export const pcScreen = z => faceY(0.65, 4.37, 5.03, z + 0.23, z + 0.64, (w, h) => {
  g.fillStyle = "#050806"; g.fillRect(0, 0, w, h); if (powerCut()) return;
  g.fillStyle = tier("pc") === 2 ? "#ffb000" : "#39d98a"; g.font = "9px monospace";
  g.fillText("BLACK DOG", 5, 12); g.fillText("> " + fmt(S.cycles), 5, 24);
  if (Date.now() % 1000 < 500) g.fillRect(5, 30, 5, 7);
});
export const FRIDGEB = (t = tier("geladeira")) => [B(10.4, 0.05, 0.8, 0.8, t === 2 ? 2.1 : 1.9, ["#cfcac0", "#a9b8b2", "#c3c9d1"][t])];
export const BEDB = (t = tier("cama")) => {
  const wide = t >= 1 ? 1.6 : 1.2, y = 8.2;
  return [B(0.02, y, 0.12, wide, 0.95, "#2a211b"), B(0.02, y, 2.2, wide, 0.35, "#2a211b"),
    B(0.1, y + 0.05, 2.05, wide - 0.1, 0.18, t === 2 ? "#3f6f86" : "#d8d4cc", 0.35),
    B(0.15, y + 0.15, 0.45, wide - 0.3, 0.1, "#ece8e0", 0.53),
    B(0.7, y + 0.05, 1.45, wide - 0.1, 0.06, ["#3a3f4f", "#5a1f24", "#2f4f5f"][t], 0.53),
    B(0.7, y + 0.05, 0.16, wide - 0.1, 0.075, ["#565d72", "#7a2e35", "#46707f"][t], 0.53), // folded-back sheet
    B(0.02, y, 0.16, 0.12, 1.15, "#1f1813"), B(0.02, y + wide - 0.12, 0.16, 0.12, 1.15, "#1f1813")]; // bed posts
};
// R2-DEBT grows its first server rack at Hardware 10
export const RACKS = () => Array.from({ length: Math.min(5, Math.floor(S.levels.hardware / 10)) }, (_, i) => B(11.1, 4.35 + i * 1.05, 0.8, 0.85, 2.0, "#18181c"));
export const CABINETS = () => Array.from({ length: Math.min(4, 1 + Math.floor(S.levels.dados / 5)) }, (_, i) => B(7.15, 5.6 + i * 0.62, 0.55, 0.58, 1.3, "#4a4a52"));

// lore and easter eggs: found ones are counted as "pistas"
export const CORK = ["A nota fiscal do R2-DEBT diz 'Black Dog Systems, 1999'. Estamos em 1986.", "Toda manchete que o R2-DEBT imprime... acontece. Depois.",
  "Lena sabia de alguma coisa. Por isso sumiu.", "Quem paga essa luz? Os números não fecham.", "O cachorro preto aparece quando o mercado vira."];
export function found(egg, text) {
  if (!S.eggs[egg]) { S.eggs[egg] = 1; gainXp(35); S.cycles += 1 + totalRate() * 600; toast("Pista encontrada"); save(); }
  say(text, 6000);
}

// Objects: boxes() for drawing/collision, spot = where Dex stands to use it, seat = where he ends up, act = what happens.
export const O = [];
// which catalog item each object belongs to; objects without one are part of the bare apartment
const OWN = { shelf: "shelf", tv: "tv", coffee: "coffee", sofaA: "sofa", sofa: "sofa", sofaBack: "sofa", sofaB: "sofa", lamp: "lamp", armchair: "armchair",
  records: "records", desk: "desk", chair: "deskchair", chairBack: "deskchair", photo: "desk", cork: "cork", clock: "clock", counter: "counter",
  table: "ktable", kchair: "ktable", kchairBack: "ktable", ticker: "ticker", cabinets: "cabinets", floppies: "floppies", safe: "safe",
  bed: "bed", note: "bed", nightstand: "nightstand", wardrobe: "wardrobe", tub: "tub", duck: "tub" };
// tagged here, at registration: a load-time sweep over O would run before the furniture files have registered themselves
export const obj = o => (OWN[o.id] && (o.own = OWN[o.id]), O.push(o), o);
export const sit = (x, y, z, front = false) => ({ x, y, z, front });

