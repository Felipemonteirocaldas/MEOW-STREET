import { tr } from "../lang.js";
import { LINES, S, esc } from "../game/state.js";
import { toast } from "./overlays.js";
import { owns } from "../game/catalog.js";
import { activeMods, claimAd } from "../game/production.js";
import { OPTS, saveOpts } from "../menu.js";
import { say } from "../characters/dex.js";

// radio: real internet stations (Radio Browser, free, no key), keeps playing while the game is open
export const radioEl = document.getElementById("radio"), radioc = document.getElementById("radioc"), audio = new Audio();
const GENRES = { jazz: "Jazz", blues: "Blues", noir: "Noir", lounge: "Lounge", classical: "Clássica", news: "Notícias" };
for (const k in GENRES) GENRES[k] = tr(GENRES[k]);
let station = null, curTag = "jazz"; // station: { url, name, meta }
audio.onplay = audio.onpause = () => { S.radio = station && !audio.paused ? station.name : null; renderNow(); };
export const radioNow = () => ({ name: station ? station.name : "", playing: !!station && !audio.paused });
export function toggleRadio() { if (!station) return false; audio.paused ? audio.play().catch(() => toast("Estação fora do ar")) : audio.pause(); return true; }
audio.onerror = () => { if (station) toast("Estação fora do ar"); };
async function loadStations(tag) {
  curTag = tag;
  radioc.querySelectorAll("[data-tag]").forEach(b => b.classList.toggle("on", b.dataset.tag === tag));
  const box = radioc.querySelector(".stations"); box.innerHTML = `<p class="sub">${tr("Sintonizando...")}</p>`;
  try {
    const r = await fetch(`https://de1.api.radio-browser.info/json/stations/search?tag=${tag}&limit=30&hidebroken=true&order=clickcount&reverse=true`);
    const list = (await r.json()).filter(s => s.url_resolved && (location.protocol === "http:" || s.url_resolved.startsWith("https")));
    box.innerHTML = list.map(s => {
      const meta = [s.countrycode, s.bitrate ? s.bitrate + " kbps" : ""].filter(Boolean).join(" · ");
      return `<div class="station ${station && station.url === s.url_resolved ? "on" : ""}" data-url="${esc(s.url_resolved)}" data-name="${esc(s.name.trim())}" data-meta="${esc(meta)}">
        <span class="st-name">${esc(s.name.trim())}</span><span class="st-meta">${esc(meta)}</span></div>`;
    }).join("") || `<p class="sub">${tr("Nada nessa frequência.")}</p>`;
    renderNow();
  } catch (e) { box.innerHTML = `<p class="sub">${tr("Sem sinal. Verifique a conexão.")}</p>`; }
}
function renderNow() {
  const el = radioc.querySelector(".np"); if (!el) return;
  const playing = station && !audio.paused;
  el.innerHTML = `<div class="np-label ${playing ? "live" : ""}">${tr(playing ? "● NO AR" : station ? "PAUSADO" : "DESLIGADO")}</div>
    <div class="np-name">${station ? esc(station.name) : tr("Gire o dial: escolha uma estação")}</div><div class="np-sub">${station ? esc(station.meta) : "&nbsp;"}</div>`;
  const pb = radioc.querySelector("[data-play]"); if (pb) { pb.textContent = playing ? "❚❚" : "▶"; pb.disabled = !station; }
  const items = [...radioc.querySelectorAll(".station")];
  items.forEach(s => s.classList.toggle("on", !!station && s.dataset.url === station.url));
  const i = items.findIndex(s => station && s.dataset.url === station.url), nd = radioc.querySelector(".rc-needle"); // tuning needle slides to the station
  if (nd) nd.style.left = (i < 0 ? 3 : 3 + i / Math.max(1, items.length - 1) * 94) + "%";
}
// the radio opens face-on like the TV: bakelite pocket radio, or the vitrola's wooden console once bought
export function openRadio() {
  const ad = !owns("tv") && activeMods().find(m => m.sponsored && !S.claimed[m.id]); // no TV yet: the sponsored spot airs on the radio
  radioc.className = "radio-cab " + (owns("records") ? "wood" : "bakelite");
  radioc.innerHTML = `<div class="rc-top"><span class="rc-brand">${owns("records") ? "BLACK DOG · HI-FI" : "ROYALE 7 · TRANSISTOR"}</span><button class="rc-x" data-close aria-label="Fechar">✕</button></div>
    <div class="rc-dial">
      <div class="np"></div>
      <div class="rc-scale"><span>55</span><span>70</span><span>90</span><span>110</span><span>130</span><span>160</span><i class="rc-needle"></i></div>
      <div class="stations"></div>
    </div>
    ${ad ? `<div class="radio-ad" id="radioad"><div><b>${tr("COMERCIAL")} · ${esc(ad.advertiser)}</b><div class="rc-small">${tr("ouça e ganhe ×{m} por {d} min", { m: ad.reward.mult, d: ad.reward.dur_min })}</div></div><button data-adlisten="${ad.id}">${tr("Ouvir")}</button></div>` : ""}
    <div class="genres">${Object.entries(GENRES).map(([k, v]) => `<button data-tag="${k}">${v}</button>`).join("")}</div>
    <div class="rc-bottom">
      <div class="rc-grille"></div>
      <div class="rc-controls">
        <button class="rc-knob" data-play aria-label="Tocar ou pausar">▶</button>
        <label class="rc-vol"><span>VOLUME <b class="np-volv">${Math.round(OPTS.volume * 100)}%</b></span><input type="range" min="0" max="1" step="0.05" value="${OPTS.volume}" data-vol></label>
      </div>
    </div>`;
  radioEl.hidden = false; renderNow(); loadStations(curTag);
}
radioc.addEventListener("input", e => {
  if (!e.target.closest("[data-vol]")) return;
  OPTS.volume = +e.target.value; saveOpts(); radioc.querySelector(".np-volv").textContent = Math.round(OPTS.volume * 100) + "%";
});
// click (not pointerdown) so scrolling the station list never changes the station
radioEl.addEventListener("click", e => {
  const tag = e.target.closest("[data-tag]"), st = e.target.closest(".station"), adb = e.target.closest("[data-adlisten]");
  if (e.target.closest("[data-vol]")) return;
  if (e.target.closest("[data-close]") || !e.target.closest(".radio-cab")) { radioEl.hidden = true; return; }
  if (e.target.closest("[data-play]")) { if (station) audio.paused ? audio.play().catch(() => toast("Estação fora do ar")) : audio.pause(); return; }
  if (adb) {
    const m = S.mods[adb.dataset.adlisten], box = radioc.querySelector("#radioad"); let t = 7;
    box.innerHTML = `<div><b>${tr("COMERCIAL")} · ${esc(m.advertiser)}</b><div class="sub"><i>"${esc(m.slogan || m.headline)}"</i> · <span class="tip">${tr("no ar... {t}s", { t })}</span></div></div>`;
    const iv = setInterval(() => {
      if (--t > 0) { const s = box.querySelector(".tip"); if (s) s.textContent = tr("no ar... {t}s", { t }); return; }
      clearInterval(iv); claimAd(m.id); box.innerHTML = `<b>${tr("Bônus ×{m} em {line} por {d} min", { m: S.bonus.mult, line: LINES[m.line].name, d: m.reward.dur_min })}</b>`; say("Bom comercial, até.");
    }, 1000);
    return;
  }
  if (tag) return loadStations(tag.dataset.tag);
  if (st) { station = { url: st.dataset.url, name: st.dataset.name, meta: st.dataset.meta }; audio.src = station.url; audio.play().catch(() => toast("Estação fora do ar")); renderNow(); }
});
S.radio = null; // audio can't autoplay after a reload

