import { tr } from "../lang.js";
import { powerCut } from "../game/bills.js";
import { dex, say } from "../characters/dex.js";
import { activeMods, claimAd } from "../game/production.js";
import { LINES, S, esc } from "../game/state.js";
import { clamp100, pick, tier } from "../engine/draw.js";
import { TV_FUN } from "../game/catalog.js";

// ---------- UI pieces ----------
export const floats = [];
export function toast(text) { floats.push({ text: tr(text), t: 0 }); }
export const overlayOpen = () => !!document.querySelector(".overlay:not([hidden])");

// TV (ads live here)
const tvEl = document.getElementById("tv"), tvScreen = document.getElementById("tvs"), tvc = document.getElementById("tvc");
export let tv = null, tvPending = false;
export const setTvPending = v => { tvPending = v; };
function later(fn, ms) { tv.timers.push(setTimeout(fn, ms)); }
export function tvOn() {
  tvPending = false;
  if (powerCut()) { say("Sem luz, sem TV. Ótimo."); return; }
  const ad = activeMods().find(m => m.sponsored && !S.claimed[m.id]);
  tv = { ad, timers: [] };
  S.needs.diversao = clamp100(S.needs.diversao + TV_FUN[tier("tv")]);
  tvEl.hidden = false; tvScreen.classList.remove("on"); void tvScreen.offsetWidth; tvScreen.classList.add("on");
  tvc.innerHTML = '<div class="noise"></div>';
  later(() => ad ? showAd(ad) : showNews(), 800);
}
function showAd(m) {
  const done = () => {
    if (!tv || tv.done) return; tv.done = true;
    claimAd(m.id);
    tvc.innerHTML = `<div class="ch">${tr("RELAXAMENTO")}</div><div class="brand pop" style="animation-delay:0s">×${S.bonus.mult}</div><div class="hl">${tr("{line} turbinado por {m} min.", { line: LINES[m.line].name, m: m.reward.dur_min })}</div>`;
    say("Ahh... agora sim. R2-DEBT, acelera aí.");
  };
  if (m.video) { tvc.innerHTML = `<video src="${esc(m.video)}" autoplay muted playsinline></video>`; tvc.querySelector("video").onended = done; return; }
  tvc.innerHTML = `<div class="adbg"></div><div class="noise grain"></div><div class="ch">${tr("CANAL 4 · COMERCIAL")}</div><div class="brand pop">${esc(m.advertiser)}</div>
    <div class="hl"></div><div class="slogan">${esc(m.slogan || "")}</div><div class="bar"><b></b></div>`;
  later(() => { const b = tvc.querySelector(".bar b"); if (b) b.style.width = "100%"; }, 30);
  const hl = tvc.querySelector(".hl");
  for (let i = 1; i <= m.headline.length; i++) later(() => { hl.textContent = m.headline.slice(0, i); }, 1400 + i * 35);
  later(done, 7000);
}
function showNews() {
  const m = pick(activeMods().filter(x => !x.sponsored).concat([null]));
  tvc.innerHTML = `<div class="ch">${tr("CANAL 7 · PLANTÃO")}</div><div class="hl">${m ? esc(m.headline) : tr("Sem novidades. Só reprise de filme policial.")}</div>`;
}
function tvOff() { if (tv) tv.timers.forEach(clearTimeout); tv = null; tvEl.hidden = true; dex.idle = 6; }
tvEl.addEventListener("click", e => { if (!e.target.closest(".crt")) tvOff(); });
tvEl.addEventListener("ovclose", tvOff);

