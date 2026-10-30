// Every overlay (sheets, papers, radio, TV, PC, window view) gets: a close button, Esc, and the phone's Back button.
// Overlays with their own cleanup listen for "ovclose" (TV, PC, window view); everything else just hides.
const SKIP = "menu-screen";
const overlays = () => [...document.querySelectorAll(".overlay")].filter(o => !o.classList.contains(SKIP) && o.id !== "gameover");
const topmost = () => overlays().filter(o => !o.hidden).sort((a, b) => (+getComputedStyle(b).zIndex || 0) - (+getComputedStyle(a).zIndex || 0))[0];
export function closeOverlay(el) { el.dispatchEvent(new CustomEvent("ovclose")); el.hidden = true; }

for (const o of overlays()) {
  o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true");
  if (!o.querySelector(".close, .ov-x")) {
    const x = Object.assign(document.createElement("button"), { className: "ov-x", type: "button", textContent: "✕" });
    x.setAttribute("aria-label", "Fechar"); x.addEventListener("pointerdown", e => e.stopPropagation()); x.addEventListener("click", () => closeOverlay(o));
    const host = o.querySelector(".news-paper"); // papers carry the button inside, so it scrolls into view with the sheet on phones
    if (host) { // the sheet's content is rewritten with innerHTML on every refresh, so put the button back whenever it goes missing
      x.classList.add("in"); const keep = () => { if (x.parentNode !== host) host.prepend(x); }; keep(); new MutationObserver(keep).observe(host, { childList: true });
    } else o.prepend(x);
  }
}
document.querySelectorAll(".overlay .close").forEach(b => b.setAttribute("aria-label", "Fechar"));

// Back button: opening an overlay pushes one history entry, so Back closes it instead of leaving the game
let depth = 0;
const watch = new MutationObserver(list => list.forEach(m => {
  const o = m.target; if (!o.classList || o.classList.contains(SKIP) || o.id === "gameover") return;
  if (!o.hidden) { history.pushState({ ov: o.id }, ""); depth++; o.querySelector(".ov-x, .close")?.focus({ preventScroll: true }); }
}));
overlays().forEach(o => watch.observe(o, { attributes: true, attributeFilter: ["hidden"] }));
addEventListener("popstate", () => { depth = Math.max(0, depth - 1); const t = topmost(); if (t) closeOverlay(t); });
addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  const t = topmost(); if (!t) return;
  e.preventDefault(); closeOverlay(t);
});
