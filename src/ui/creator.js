import { S, save } from "../game/state.js";
import { GROUPS, randomLook } from "../characters/look.js";
import { figure } from "../characters/figure.js";
import { tr } from "../lang.js";

// Character creator (menu screen "creator"): live preview on the left, one row per option on the right. Edits S.look directly.
let front = true;
const row = r => {
  const v = S.look[r.k], head = `<span>${tr(r.label || "Tom de pele")}</span>`;
  if (r.opts) return `<div class="cr-row">${head}<div class="cr-chips">${r.opts.map((n, i) => `<button class="${v === i ? "on" : ""}" data-look="${r.k}:${i}">${tr(n)}</button>`).join("")}</div></div>`;
  if (r.swatches) return `<div class="cr-row">${head}<div class="cr-chips">${r.swatches.map((c, i) => `<button class="sw ${v === i ? "on" : ""}" style="background:${c}" data-look="${r.k}:${i}" aria-label="${tr("Tom de pele")} ${i + 1}"></button>`).join("")}</div></div>`;
  return `<label class="cr-row">${head}<input type="color" value="${v}" data-lcolor="${r.k}"></label>`;
};
export const creatorHTML = () => `<h2 class="menu-h">${tr("Seu personagem")}</h2><div class="cr">
  <div class="cr-prev"><canvas id="cr-c" width="240" height="290"></canvas><div class="cr-btns"><button data-turn>${tr("Virar")}</button><button data-rand>${tr("Aleatório")}</button></div></div>
  <div class="cr-opts">${GROUPS.map(([t, rows]) => `<h3>${tr(t)}</h3>${rows.map(row).join("")}`).join("")}</div></div>
  <div class="menu-btns"><button data-go="creator-done">${tr("Pronto")}</button></div>`;

export function paintCreator() {
  const cv = document.getElementById("cr-c"); if (!cv) return;
  const c = cv.getContext("2d"); c.clearRect(0, 0, cv.width, cv.height);
  c.fillStyle = "rgba(0,0,0,.35)"; c.beginPath(); c.ellipse(120, 266, 58, 14, 0, 0, 7); c.fill();
  figure(c, 120, 262, 16, { look: S.look, front, sit: false, swing: 0, nude: false, now: Date.now(), bat: false });
}
const menuc = document.getElementById("menuc");
menuc.addEventListener("click", e => {
  if (menuc.closest("#menu").dataset.screen !== "creator") return;
  const b = e.target.closest("[data-look]");
  if (b) { const [k, i] = b.dataset.look.split(":"); S.look[k] = +i; b.parentNode.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); }
  else if (e.target.closest("[data-turn]")) front = !front;
  else if (e.target.closest("[data-rand]")) { randomLook(); menuc.innerHTML = creatorHTML(); menuc.insertAdjacentHTML("afterbegin", `<button class="menu-x" data-go="creator-done" aria-label="${tr("Voltar")}">←</button>`); }
  else return;
  save(); paintCreator();
});
menuc.addEventListener("input", e => { const k = e.target.dataset.lcolor; if (k) { S.look[k] = e.target.value; save(); paintCreator(); } });
