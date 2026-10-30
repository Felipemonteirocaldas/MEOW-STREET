import { S } from "../game/state.js";

// Dex's look: what the character creator edits and figure.js draws. Indexes point into the lists below; colours are #rrggbb.
// The defaults are the original Dex (detective coat over pink polka-dot pyjamas), so old saves look exactly as before.
export const DEFAULT_LOOK = {
  body: 0, skin: 2, hair: 0, hairCol: "#1d1410", eyes: 0, eyeCol: "#17120f", brows: 0, nose: 0, mouth: 0, lipCol: "#3a1f1a", beard: 1, glasses: 0, freckles: 0,
  top: 0, topCol: "#26262d", bottom: 0, botCol: "#e58fb4", shoes: 0, shoeCol: "#f4b8cf", hat: 1, hatCol: "#26262d",
};
S.look = Object.assign({}, DEFAULT_LOOK, S.look);
export const SKINS = ["#f2d8c6", "#e5bf9d", "#c9b2a0", "#d19a6b", "#a8714a", "#7a4b2e", "#4e2f1e"];

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const out = a => "#" + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
export const shade = (h, k) => out(hex(h).map(v => v * k)); // k < 1 darkens
export const lift = (h, n) => out(hex(h).map(v => v + n));  // lightens by n steps per channel

// one row per control in the creator: opts = choices, swatches = skin tones, color = free colour picker
export const GROUPS = [
  ["Corpo e pele", [{ k: "body", label: "Corpo", opts: ["Masculino", "Feminino", "Não binário"] }, { k: "skin", label: "Tom de pele", swatches: SKINS }]],
  ["Cabelo", [{ k: "hair", label: "Estilo", opts: ["Curto", "Longo", "Coque", "Volumoso", "Careca", "Rabo de cavalo", "Chanel", "Cacheado"] }, { k: "hairCol", label: "Cor do cabelo", color: 1 }]],
  ["Rosto", [
    { k: "eyes", label: "Olhos", opts: ["Padrão", "Redondos", "Amendoados"] }, { k: "eyeCol", label: "Cor dos olhos", color: 1 },
    { k: "brows", label: "Sobrancelhas", opts: ["Sérias", "Grossas", "Arqueadas"] }, { k: "nose", label: "Nariz", opts: ["Fino", "Pequeno", "Largo"] },
    { k: "mouth", label: "Boca", opts: ["Reta", "Sorriso", "Lábios cheios"] }, { k: "lipCol", label: "Cor da boca", color: 1 },
    { k: "beard", label: "Pelos", opts: ["Nenhum", "Barba por fazer", "Bigode", "Barba cheia"] }, { k: "glasses", label: "Óculos", opts: ["Nenhum", "Redondos", "Quadrados"] },
    { k: "freckles", label: "Sardas", opts: ["Sem", "Com"] }]],
  ["Roupas", [
    { k: "top", label: "Parte de cima", opts: ["Casaco de detetive", "Moletom", "Camiseta", "Jaqueta"] }, { k: "topCol", label: "Cor", color: 1 },
    { k: "bottom", label: "Parte de baixo", opts: ["Pijama de bolinhas", "Calça", "Short", "Saia"] }, { k: "botCol", label: "Cor", color: 1 },
    { k: "shoes", label: "Calçado", opts: ["Pantufa", "Tênis", "Bota"] }, { k: "shoeCol", label: "Cor", color: 1 },
    { k: "hat", label: "Chapéu", opts: ["Sem chapéu", "Fedora", "Boina", "Gorro", "Chapéu de palha"] }, { k: "hatCol", label: "Cor", color: 1 }]],
];
const pick = a => a[Math.floor(Math.random() * a.length)];
const HAIR = ["#1d1410", "#3b2417", "#6b4423", "#a9743b", "#d9b36a", "#8a8a8a", "#c0392b", "#2d4a7a", "#7a3fa0"], FABRIC = ["#26262d", "#7a1f2b", "#1f4a5a", "#4a5a2a", "#8a6a2a", "#d9d5cb", "#3a3a8a", "#e58fb4"];
export function randomLook() {
  const L = {};
  for (const [, rows] of GROUPS) for (const r of rows) if (r.opts) L[r.k] = Math.floor(Math.random() * r.opts.length); else if (r.swatches) L[r.k] = Math.floor(Math.random() * r.swatches.length);
  Object.assign(L, { hairCol: pick(HAIR), eyeCol: pick(["#17120f", "#4a2d17", "#2d5a8a", "#3a7a4a", "#6a6a6a"]), lipCol: pick(["#3a1f1a", "#a8384a", "#8a4a3a"]), topCol: pick(FABRIC), botCol: pick(FABRIC), shoeCol: pick(FABRIC), hatCol: pick(FABRIC) });
  Object.assign(S.look, L);
}
