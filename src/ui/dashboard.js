import { LINES, S, esc, now } from "../game/state.js";
import { activeMods, catMult, fmt, totalRate } from "../game/production.js";
import { fee, fmtUSD } from "../game/market.js";
import { payBill } from "../game/bills.js";
import { ACHIEVEMENTS, unlocked } from "../game/achievements.js";
import { OPTS, saveOpts } from "../menu.js";
import { audio, openRadio, radioNow, toggleRadio } from "./radio.js";
import { toast } from "./overlays.js";
import { tr } from "../lang.js";
import { IC, ico } from "./icons.js";
import { dailyGoals } from "../game/daily.js";

// Desktop dashboard: everything worth a glance while the game runs in a tab all day. "Painel" mode hides the apartment and spreads the cards across the screen.
const dash = document.getElementById("dash"), body = document.body;
const click = id => document.getElementById(id)?.click();

dash.innerHTML = `<div class="dgrid">
  <div class="dcard kpis"></div>
  <div class="dcard"><div class="dh">${ico("exchange")}<b>${tr("Preço do BDC")}</b><span id="d-chg"></span></div><canvas id="d-spark"></canvas><div class="dsub" id="d-mood"></div></div>
  <div class="dcard"><div class="dh">${ico("news")}<b>${tr("Notícias no ar")}</b><button class="dlink" data-go="newsbtn">${tr("ver todas")}</button></div><div id="d-news"></div></div>
  <div class="dcard"><div class="dh">${ico("mail")}<b>${tr("Contas")}</b></div><div id="d-bills"></div></div>
  <div class="dcard"><div class="dh">${ico("radio")}<b>${tr("Rádio")}</b><button class="dlink" data-radio>${tr("sintonizar")}</button></div>
    <div class="dradio"><button class="dplay" data-rplay aria-label="${tr("Tocar ou pausar")}"></button><div class="dnow"><b id="d-st"></b><span id="d-st2"></span></div></div>
    <label class="dvol">${IC.volume}<input type="range" min="0" max="1" step="0.05" id="d-vol"></label></div>
  <div class="dcard"><div class="dh">${ico("cat")}<b>Sombra</b></div><div id="d-cat"></div></div>
  <div class="dcard"><div class="dh">${ico("produce")}<b>${tr("Meta do dia")}</b><span id="d-gsum" class="dsub"></span></div><div id="d-goals"></div></div>
  <div class="dcard dact"><button data-go="prodbtn">${ico("produce")}${tr("Produção")}</button><button data-go="exchbtn">${ico("exchange")}${tr("Corretora")}</button><button data-go="shopbtn">${ico("shop")}${tr("Catálogo")}</button><button data-go="pausebtn">${ico("trophy")}<span id="d-ach"></span></button></div>
</div>`;
const q = id => dash.querySelector(id);
const kpi = (label, big, sub, cls = "") => `<div class="kpi ${cls}"><span>${label}</span><b>${big}</b><em>${sub}</em></div>`;
const left = ms => { const m = Math.ceil(ms / 60000); return m < 60 ? m + " min" : m < 2880 ? Math.round(m / 60) + " h" : Math.round(m / 1440) + " d"; };

function spark() {
  const c = q("#d-spark"), x = c.getContext("2d"), dpr = devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight, p = S.hist.length > 1 ? S.hist : [S.price, S.price];
  if (!w) return;
  c.width = w * dpr; c.height = h * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
  const lo = Math.min(...p), hi = Math.max(...p), sy = v => h - 4 - (v - lo) / (hi - lo || 1) * (h - 10), up = p[p.length - 1] >= p[0], col = up ? "#7fcf9a" : "#ff6a6a";
  x.beginPath(); p.forEach((v, i) => { const px = i / (p.length - 1) * w; i ? x.lineTo(px, sy(v)) : x.moveTo(px, sy(v)); });
  x.strokeStyle = col; x.lineWidth = 2; x.stroke(); x.lineTo(w, h); x.lineTo(0, h); x.closePath(); x.fillStyle = up ? "rgba(127,207,154,.12)" : "rgba(255,106,106,.12)"; x.fill();
}

function update() {
  if (document.hidden) return;
  const rate = totalRate(), chg = S.hist.length ? (S.price / S.hist[0] - 1) * 100 : 0;
  q(".kpis").innerHTML = kpi(tr("Caixa"), fmtUSD(S.usd), tr("dólares"), "usd") + kpi("BDC", fmt(S.cycles), "≈ " + fmtUSD(S.cycles * S.price), "bdc")
    + kpi(tr("Produção"), fmt(rate), tr("BDC/s · ≈ {v}/min", { v: fmtUSD(rate * S.price * 60) }), "rate") + kpi(tr("Patrimônio"), fmtUSD(S.usd + S.cycles * S.price), tr("BDC + caixa"), "net");
  q("#d-chg").className = chg >= 0 ? "up" : "down"; q("#d-chg").textContent = `${chg >= 0 ? "▲" : "▼"} ${Math.abs(chg).toFixed(1)}%`;
  q("#d-mood").textContent = `${fmtUSD(S.price)} · ${tr("taxa de {f}% por operação", { f: fee() * 100 })}`; spark();
  const mods = activeMods().filter(m => !m.sponsored).sort((a, b) => Math.abs(b.mult - 1) - Math.abs(a.mult - 1)).slice(0, 5);
  q("#d-news").innerHTML = mods.map(m => `<div class="dnews ${m.mult >= 1 ? "up" : "down"}" data-go="newsbtn"><b>${m.mult >= 1 ? "▲" : "▼"} ${LINES[m.line].name} ×${m.mult}</b><span>${esc(m.headline)}</span><em>${left(m.until - now())}</em></div>`).join("") || `<div class="dsub">${tr("Nenhum sinal ativo.")}</div>`;
  const bills = [...S.bills].sort((a, b) => a.due - b.due);
  q("#d-bills").innerHTML = bills.map(b => `<div class="dbill"><span>${tr(b.kind)}</span><b class="${now() > b.due ? "down" : ""}">${fmtUSD(b.amount)}</b><em>${now() > b.due ? tr("ATRASADA") : left(b.due - now())}</em><button data-pay="${b.id}" ${S.usd < b.amount ? "disabled" : ""}>${tr("Pagar")}</button></div>`).join("") || `<div class="dsub">${tr("Sem contas pendentes.")}</div>`;
  const r = radioNow(); q("#d-st").textContent = r.name || tr("Rádio desligado"); q("#d-st2").textContent = r.playing ? tr("● NO AR") : r.name ? tr("PAUSADO") : tr("Escolha uma estação"); q("[data-rplay]").innerHTML = r.playing ? IC.pause : IC.play;
  q("#d-vol").value = OPTS.volume;
  const bar = (v, label, cls = "") => `<div class="dbar ${cls}"><span>${label}</span><i><b style="width:${Math.round(v)}%"></b></i><em>${Math.round(v)}%</em></div>`;
  q("#d-cat").innerHTML = bar(S.cat.aff, tr("Afeto")) + bar(S.cat.hunger, tr("Saciedade"), S.cat.hunger < 25 ? "low" : "") + `<div class="dsub">${tr("Bônus de produção: ×{x}", { x: catMult().toFixed(2) })}</div>`;
  const goals = dailyGoals(); q("#d-gsum").textContent = `${goals.filter(g => g.done).length}/3`;
  q("#d-goals").innerHTML = goals.map(g => `<div class="dgoal ${g.done ? "done" : ""}"><span>${g.done ? "✓ " : ""}${tr(g.name, { n: g.need })}</span><i><b style="width:${Math.round(g.have / g.need * 100)}%"></b></i></div>`).join("");
  q("#d-ach").textContent = `${unlocked()}/${ACHIEVEMENTS.length}`;
  // the tab title is a status bar for people who keep the game in a background tab
  document.title = `${S.bills.some(b => now() > b.due) ? "⚠ " : ""}${fmt(rate)} BDC/s · ${fmtUSD(S.usd)} — MEOW-STREET`;
}

dash.addEventListener("click", e => {
  const go = e.target.closest("[data-go]"); if (go) return click(go.dataset.go);
  const pay = e.target.closest("[data-pay]"); if (pay && !pay.disabled) { if (payBill(+pay.dataset.pay)) toast("Conta paga"); return update(); }
  if (e.target.closest("[data-radio]")) return openRadio();
  if (e.target.closest("[data-rplay]")) { if (!toggleRadio()) openRadio(); setTimeout(update, 150); }
});
dash.addEventListener("input", e => { if (e.target.id === "d-vol") { OPTS.volume = +e.target.value; audio.volume = OPTS.volume; saveOpts(); } });

// header buttons: panel mode and full screen (desktop). F = full screen, P = panel mode.
const focusBtn = document.getElementById("focusbtn"), fsBtn = document.getElementById("fsbtn");
const paintBtns = () => { focusBtn.innerHTML = body.classList.contains("focus") ? IC.scene : IC.panel; fsBtn.innerHTML = document.fullscreenElement ? IC.unfull : IC.full; };
const toggleFocus = () => { body.classList.toggle("focus"); paintBtns(); setTimeout(update, 50); dispatchEvent(new Event("resize")); try { localStorage.setItem("bd-focus", body.classList.contains("focus") ? "1" : ""); } catch (e) {} };
const toggleFs = () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.().catch(() => toast("Tela cheia indisponível"));
focusBtn.title = tr("Modo painel (P)"); fsBtn.title = tr("Tela cheia (F)");
focusBtn.addEventListener("click", toggleFocus); fsBtn.addEventListener("click", toggleFs);
document.addEventListener("fullscreenchange", () => { paintBtns(); dispatchEvent(new Event("resize")); });
addEventListener("keydown", e => {
  if (e.target.closest("input, textarea, select, [contenteditable]") || e.ctrlKey || e.metaKey || e.altKey) return;
  if (document.querySelector(".overlay:not([hidden])")) return;
  if (e.key === "f" || e.key === "F") toggleFs(); else if (e.key === "p" || e.key === "P") toggleFocus();
});
try { if (localStorage.getItem("bd-focus") && matchMedia("(min-width:1000px) and (pointer:fine)").matches) body.classList.add("focus"); } catch (e) {}
paintBtns(); update(); setInterval(update, 1000);
