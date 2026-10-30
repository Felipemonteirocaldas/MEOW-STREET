import { LINES, S, now, save } from "./state.js";
import { tr } from "../lang.js";
import { toast } from "../ui/overlays.js";

// "Primeiros passos": one objective at a time, in a slim banner above the tabs. Each tap on it opens the panel that does the job.
const STEPS = [
  { id: "pc", text: "Toque no computador (nos caixotes). Com o PC ligado o Dex trabalha e gera BDC.", done: () => S.flags.pc, go: null },
  { id: "news", text: "Abra a aba Notícias: manchetes reais mexem na produção.", done: () => S.flags.news, go: "newsbtn" },
  { id: "hire", text: "Compre um nível de Hardware em Produção.", done: () => Object.values(S.levels).some(v => v > 0), go: "prodbtn" },
  { id: "sold", text: "Venda um pouco de BDC na Corretora para ter dólares.", done: () => S.flags.sold, go: "exchbtn" },
  { id: "paid", text: "Pague a conta que chegou por baixo da porta (toque na pilha de correspondência).", done: () => S.flags.paid, go: null },
  { id: "furn", text: "Compre seu primeiro móvel no Catálogo.", done: () => S.flags.furn, go: "shopbtn" },
  { id: "pet", text: "Faça carinho no Sombra: toque nele.", done: () => S.flags.pet, go: null },
];
const el = document.createElement("div"); el.id = "goal"; el.hidden = true;
document.querySelector("nav.tabs").before(el);
function paint() {
  if (S.tutOff) return (el.hidden = true);
  const i = STEPS.findIndex(s => !s.done());
  if (i < 0) { S.tutOff = now(); save(); toast("Primeiros passos concluídos"); return (el.hidden = true); }
  const s = STEPS[i], html = `<span class="n">${i + 1}/${STEPS.length}</span><span class="t">${tr(s.text)}</span><button class="skip" aria-label="${tr("Dispensar dicas")}">✕</button>`;
  if (el.dataset.k !== html) { el.dataset.k = html; el.innerHTML = html; el.dataset.go = s.go || ""; }
  el.hidden = false;
}
el.addEventListener("click", e => {
  if (e.target.closest(".skip")) { S.tutOff = now(); save(); return paint(); }
  if (el.dataset.go) document.getElementById(el.dataset.go)?.click();
});
setInterval(paint, 700); paint();
