import { tr } from "../lang.js";
import { LINES, S, esc } from "../game/state.js";
import { toast } from "./overlays.js";
import { owns } from "../game/catalog.js";
import { activeMods, claimAd } from "../game/production.js";
import { OPTS, saveOpts } from "../menu.js";
import { say } from "../characters/dex.js";

// radio: real internet stations (curated 24/7 HTTPS presets + Radio Browser when available), keeps playing while the game is open
export const radioEl = document.getElementById("radio"), radioc = document.getElementById("radioc"), audio = new Audio();
const GENRES = { jazz: "Jazz", blues: "Blues", noir: "Noir", lounge: "Lounge", classical: "Clássica", news: "Notícias" };
for (const k in GENRES) GENRES[k] = tr(GENRES[k]);
const PRESETS = {
  jazz: [
    ["KCSM Jazz 91.1", "US · 128 kbps", "https://ice7.securenetsystems.net/KCSM2"],
    ["TSF Jazz Paris", "FR · 128 kbps", "https://tsfjazz.ice.infomaniak.ch/tsfjazz-high.mp3"],
    ["Radio Swiss Jazz", "CH · 128 kbps", "https://stream.srg-ssr.ch/m/rsj/mp3_128"],
    ["SomaFM Sonic Universe", "US · 128 kbps", "https://ice5.somafm.com/sonicuniverse-128-mp3"],
    ["181.FM Bebop Jazz", "US · 128 kbps", "https://listen.181fm.com/181-bebop_128k.mp3"],
    ["181.FM SmoothAC Jazz", "US · 128 kbps", "https://listen.181fm.com/181-smoothac_128k.mp3"],
  ],
  blues: [
    ["181.FM True Blues", "US · 128 kbps", "https://listen.181fm.com/181-blues_128k.mp3"],
    ["GotRadio Bit O Blues", "US · 128 kbps", "https://pureplay.cdnstream1.com/6022_128.mp3"],
    ["Blues Radio UK", "GB · 128 kbps", "https://i4.streams.ovh/sc/bluesrad/stream"],
    ["SomaFM Boot Liquor", "US · 128 kbps", "https://ice5.somafm.com/bootliquor-128-mp3"],
    ["181.FM Soul & Blues", "US · 128 kbps", "https://listen.181fm.com/181-soul_128k.mp3"],
    ["Radio Paradise Rock/Blues", "US · 128 kbps", "https://stream.radioparadise.com/rock-128"],
  ],
  noir: [
    ["SomaFM Secret Agent", "US · 128 kbps", "https://ice5.somafm.com/secretagent-128-mp3"],
    ["SomaFM Illinois Street Lounge", "US · 128 kbps", "https://ice5.somafm.com/illstreet-128-mp3"],
    ["SomaFM Dark Zone", "US · 128 kbps", "https://ice5.somafm.com/darkzone-128-mp3"],
    ["SomaFM Drone Zone", "US · 128 kbps", "https://ice5.somafm.com/dronezone-128-mp3"],
    ["Nightride FM", "US · 128 kbps", "https://stream.nightride.fm/nightride.mp3"],
    ["Chillsynth FM", "US · 128 kbps", "https://stream.nightride.fm/chillsynth.mp3"],
  ],
  lounge: [
    ["SomaFM Groove Salad", "US · 128 kbps", "https://ice5.somafm.com/groovesalad-128-mp3"],
    ["SomaFM Lush", "US · 128 kbps", "https://ice5.somafm.com/lush-128-mp3"],
    ["SomaFM Beat Blender", "US · 128 kbps", "https://ice5.somafm.com/beatblender-128-mp3"],
    ["SomaFM Bossa Beyond", "US · 128 kbps", "https://ice5.somafm.com/bossa-128-mp3"],
    ["181.FM Chilled Out", "US · 128 kbps", "https://listen.181fm.com/181-chilled_128k.mp3"],
    ["Radio Paradise Mellow Mix", "US · 128 kbps", "https://stream.radioparadise.com/mellow-128"],
  ],
  classical: [
    ["WQXR 105.9 NY Classical", "US · 128 kbps", "https://stream.wqxr.org/wqxr-web"],
    ["Radio Swiss Classic", "CH · 128 kbps", "https://stream.srg-ssr.ch/m/rsc_de/mp3_128"],
    ["Venice Classic Radio", "IT · 128 kbps", "https://uk2.streamingpulse.com/ssl/vcr1"],
    ["181.FM Classical Music", "US · 128 kbps", "https://listen.181fm.com/181-classical_128k.mp3"],
    ["KUSC Classical California", "US · 128 kbps", "https://playerservices.streamtheworld.com/api/livestream-redirect/KUSCMP128.mp3"],
    ["WQXR Operavore NY", "US · 128 kbps", "https://stream.wqxr.org/q2-web"],
  ],
  news: [
    ["WNYC 93.9 FM New York", "US · 128 kbps", "https://fm939.wnyc.org/wnycfm-web"],
    ["NPR Live Program Stream", "US · 128 kbps", "https://npr-ice.streamguys1.com/live.mp3"],
    ["BBC World Service", "GB · 96 kbps", "https://stream.live.vc.bbcmedia.co.uk/bbc_world_service"],
    ["WBEZ 91.5 Chicago", "US · 128 kbps", "https://stream.wbez.org/wbez128.mp3"],
    ["KQED Public Radio", "US · 128 kbps", "https://streams.kqed.org/kqedradio"],
    ["WBUR 90.9 FM Boston", "US · 48 kbps", "https://fm909.wbur.org/wbur"],
  ],
};
const RB_HOSTS = ["https://all.api.radio-browser.info", "https://de1.api.radio-browser.info", "https://de2.api.radio-browser.info"];
let station = null, curTag = "jazz"; // station: { url, name, meta }
audio.onplay = audio.onpause = () => { S.radio = station && !audio.paused ? station.name : null; renderNow(); };
export const radioNow = () => ({ name: station ? station.name : "", playing: !!station && !audio.paused });
export function toggleRadio() { if (!station) return false; audio.paused ? audio.play().catch(() => toast("Estação fora do ar")) : audio.pause(); return true; }
audio.onerror = () => { if (station) toast("Estação fora do ar"); };
function renderList(box, items) {
  box.innerHTML = items.map(([name, meta, url]) => `<div class="station ${station && station.url === url ? "on" : ""}" data-url="${esc(url)}" data-name="${esc(name)}" data-meta="${esc(meta)}">
    <span class="st-name">${esc(name)}</span><span class="st-meta">${esc(meta)}</span></div>`).join("") || `<p class="sub">${tr("Nada nessa frequência.")}</p>`;
  renderNow();
}
async function fetchRadioBrowser(tag) {
  for (const host of RB_HOSTS) {
    try {
      const ac = new AbortController(), t = setTimeout(() => ac.abort(), 3000);
      const r = await fetch(`${host}/json/stations/search?tag=${tag}&limit=25&hidebroken=true&order=clickcount&reverse=true`, { signal: ac.signal });
      clearTimeout(t);
      if (!r.ok) continue;
      const list = (await r.json()).filter(s => s.url_resolved && (location.protocol === "http:" || s.url_resolved.startsWith("https")));
      if (list.length) return list.map(s => [s.name.trim(), [s.countrycode, s.bitrate ? s.bitrate + " kbps" : ""].filter(Boolean).join(" · "), s.url_resolved]);
    } catch (e) {}
  }
  return [];
}
async function loadStations(tag) {
  curTag = tag;
  radioc.querySelectorAll("[data-tag]").forEach(b => b.classList.toggle("on", b.dataset.tag === tag));
  const box = radioc.querySelector(".stations"), base = PRESETS[tag] || [];
  renderList(box, base);
  const extra = await fetchRadioBrowser(tag);
  if (curTag !== tag || !extra.length) return;
  const seen = new Set(base.map(s => s[2]));
  renderList(box, [...base, ...extra.filter(s => !seen.has(s[2]))]);
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
