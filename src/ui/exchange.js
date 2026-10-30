import { S, now } from "../game/state.js";
import { tr } from "../lang.js";
import { fee, buyBDC, fmtUSD, sellBDC } from "../game/market.js";
import { fmt } from "../game/production.js";
import { toast } from "./overlays.js";
import { say } from "../characters/dex.js";

// Corretora: the BDC price is real (BTC ÷ 100,000). Sell mined BDC for dollars to pay bills and buy furniture, or buy BDC when it looks cheap.
// Every trade pays the fee, so flipping back and forth loses money. The shell is built once; numbers and the chart refresh in place so the slider never resets.
const exchEl = document.getElementById("exch"), exchc = document.getElementById("exchc");
let mode = "sell", pct = 0.5;

const MOOD = [[-3, "Pânico no mercado", "down"], [-1, "Mercado nervoso", "down"], [1, "Mercado calmo", ""], [3, "Mercado animado", "up"], [Infinity, "Euforia", "up"]];
const mood = () => { const c = S.market ? S.market.change1h : 0; return MOOD.find(m => c < m[0]); };
const left = ms => { const m = Math.ceil(ms / 60000); return m < 60 ? m + " min" : m < 2880 ? Math.round(m / 60) + " h" : Math.round(m / 1440) + " d"; };
const bills = () => [...S.bills].sort((a, b) => a.due - b.due);
const owed = () => S.bills.reduce((t, b) => t + b.amount, 0);

function build() {
  exchc.innerHTML = `<div class="mast" style="font-size:26px">${tr("Corretora Black Dog")}</div>
    <div class="dateline">${tr("BDC / US$ · taxa de {f}% por operação", { f: fee() * 100 })}</div>
    <p class="sub">${tr("O R2-DEBT minera BDC; as contas e os móveis pedem dólares. Venda BDC para ter caixa, ou compre quando o preço cair. O preço segue o Bitcoin de verdade.")}</p>
    <div class="row"><b id="x-price" style="font:700 26px 'Special Elite',monospace"></b><span id="x-chg"></span></div>
    <div id="x-mood" class="tip"></div>
    <canvas id="chart"></canvas>
    <div class="x-grid" id="x-wallet"></div>
    <div id="x-bills"></div>
    <div class="x-seg"><button data-mode="sell">${tr("Vender BDC")}</button><button data-mode="buy">${tr("Comprar BDC")}</button></div>
    <div class="x-ticket"><div class="row"><span class="sub" id="x-lab"></span><b id="x-pct"></b></div><input id="x-range" type="range" min="0" max="100" step="1">
      <div class="trade" id="x-quick" style="margin:6px 0"></div><div id="x-prev" class="x-prev"></div><button id="x-go" class="x-confirm"></button></div>
    <div id="x-deals"></div>
    <p class="sub">${tr("Dica: comprar e vender de volta custa cerca de {p}%. Crashes de verdade acontecem; quem vende no pânico perde.", { p: fee() * 200 })}</p>`;
}

function chart(h) {
  const c = exchc.querySelector("#chart"), x = c.getContext("2d"), dpr = window.devicePixelRatio || 1, w = c.clientWidth, ht = c.clientHeight;
  if (!w) return;
  c.width = w * dpr; c.height = ht * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
  const lo = Math.min(...h), hi = Math.max(...h), pad = (hi - lo || hi * 0.01) * 0.15, a = lo - pad, b = hi + pad, sy = v => ht - 6 - (v - a) / (b - a) * (ht - 14);
  const px = i => h.length > 1 ? 4 + i / (h.length - 1) * (w - 8) : w / 2, up = h[h.length - 1] >= h[0], col = up ? "#1d4a2e" : "#9a1418";
  x.strokeStyle = "rgba(0,0,0,.12)"; x.lineWidth = 1; for (let i = 1; i < 4; i++) { const y = ht * i / 4; x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke(); }
  const path = () => { x.beginPath(); h.forEach((v, i) => i ? x.lineTo(px(i), sy(v)) : x.moveTo(px(i), sy(v))); };
  path(); x.lineTo(px(h.length - 1), ht); x.lineTo(px(0), ht); x.closePath(); x.fillStyle = up ? "rgba(29,74,46,.15)" : "rgba(154,20,24,.15)"; x.fill();
  path(); x.strokeStyle = col; x.lineWidth = 2; x.stroke();
  x.fillStyle = col; x.beginPath(); x.arc(px(h.length - 1), sy(h[h.length - 1]), 3.5, 0, 7); x.fill();
  x.fillStyle = "#555"; x.font = "11px 'Special Elite', monospace"; x.fillText(fmtUSD(hi), 4, 12); x.fillText(fmtUSD(lo), 4, ht - 3); x.textAlign = "right"; x.fillText(tr("2h atrás → agora"), w - 4, 12); x.textAlign = "left";
}

function preview() {
  const sell = mode === "sell", amt = (sell ? S.cycles : S.usd) * pct;
  if (sell) { const gross = amt * S.price; return { give: `${fmt(amt)} BDC`, get: fmtUSD(gross * (1 - fee())), fee: fmtUSD(gross * fee()), ok: amt > 0 }; }
  const bdc = amt / S.price * (1 - fee()); return { give: fmtUSD(amt), get: `${fmt(bdc)} BDC`, fee: fmtUSD(amt * fee()), ok: amt > 0 };
}

function update() {
  const q = id => exchc.querySelector(id), h = S.hist.length ? S.hist : [S.price], chg = (S.price / h[0] - 1) * 100, m = mood();
  q("#x-price").textContent = fmtUSD(S.price);
  q("#x-chg").className = chg >= 0 ? "up" : "down"; q("#x-chg").textContent = `${chg >= 0 ? "▲" : "▼"} ${tr("{p}% em 2h", { p: Math.abs(chg).toFixed(1) })}`;
  q("#x-mood").innerHTML = `<span class="${m[2]}">● ${tr(m[1])}</span> · ${S.market ? tr("1 BDC = BTC (US${b}) ÷ 100.000 · fonte {s}", { b: Math.round(S.market.btc).toLocaleString("en-US"), s: S.market.source }) : tr("Aguardando cotação do servidor...")}`;
  chart(h);
  const worth = S.usd + S.cycles * S.price;
  q("#x-wallet").innerHTML = `<div><span class="sub">${tr("BDC")}</span><b>${fmt(S.cycles)}</b><span class="sub">≈ ${fmtUSD(S.cycles * S.price)}</span></div><div><span class="sub">${tr("Dólares")}</span><b>${fmtUSD(S.usd)}</b><span class="sub">${tr("em caixa")}</span></div><div><span class="sub">${tr("Patrimônio")}</span><b>${fmtUSD(worth)}</b><span class="sub">${tr("BDC + caixa")}</span></div>`;
  const total = owed(), short = total - S.usd;
  q("#x-bills").innerHTML = !bills().length ? `<p class="tip">${tr("Sem contas pendentes. Elas chegam por baixo da porta todo dia.")}</p>`
    : `<div class="x-bills"><div class="row"><b>${tr("Contas a pagar")}</b><b class="${short > 0 ? "down" : ""}">${fmtUSD(total)}</b></div>
       ${bills().slice(0, 4).map(b => `<div class="row sub"><span>${tr(b.kind)}</span><span class="${now() > b.due ? "down" : ""}">${fmtUSD(b.amount)} · ${now() > b.due ? tr("ATRASADA") : tr("vence em {t}", { t: left(b.due - now()) })}</span></div>`).join("")}
       <div class="sub">${short > 0 ? tr("Faltam {v} em caixa. Venda cerca de {b} BDC para cobrir.", { v: fmtUSD(short), b: fmt(short / (S.price * (1 - fee()))) }) : tr("Seu caixa cobre todas as contas.")}</div></div>`;
  exchc.querySelectorAll("[data-mode]").forEach(b => b.classList.toggle("on", b.dataset.mode === mode));
  const sell = mode === "sell", p = preview();
  q("#x-lab").textContent = sell ? tr("Quanto do seu BDC vender") : tr("Quanto do seu dinheiro gastar");
  q("#x-pct").textContent = Math.round(pct * 100) + "%"; q("#x-range").value = Math.round(pct * 100);
  q("#x-quick").innerHTML = [0.25, 0.5, 1].map(f => `<button data-quick="${f}">${f * 100}%</button>`).join("") + (sell && short > 0 && S.cycles > 0 ? `<button data-cover="1">${tr("Cobrir contas")}</button>` : "");
  q("#x-prev").innerHTML = `${tr(sell ? "Você entrega" : "Você gasta")} <b>${p.give}</b> → ${tr("recebe")} <b>${p.get}</b> <span class="sub">(${tr("taxa")} ${p.fee})</span>`;
  const go = q("#x-go"); go.textContent = tr(sell ? "Vender" : "Comprar"); go.disabled = !p.ok;
  const deals = S.deals || [];
  q("#x-deals").innerHTML = deals.length ? `<div class="x-bills"><b>${tr("Apostas do telefone")}</b>${deals.map(d => `<div class="row sub"><span>${fmtUSD(d.stake)} → ${d.mult}×</span><span>${tr("resolve em {t}", { t: left(d.at - now()) })}</span></div>`).join("")}</div>` : "";
}

export function openExch() { exchEl.hidden = false; if (!exchc.querySelector("#chart")) build(); update(); }
exchEl.addEventListener("pointerdown", e => {
  const t = e.target;
  if (t.closest("#x-range")) return; // the slider handles itself
  if (t.closest("[data-mode]")) { mode = t.closest("[data-mode]").dataset.mode; return update(); }
  if (t.closest("[data-quick]")) { pct = +t.closest("[data-quick]").dataset.quick; return update(); }
  if (t.closest("[data-cover]")) { pct = Math.min(1, Math.max(0, (owed() - S.usd) / (S.price * (1 - fee())) / S.cycles)) || 0; return update(); }
  const go = t.closest("#x-go");
  if (go && !go.disabled) {
    if (mode === "sell") { const usd = sellBDC(S.cycles * pct); if (usd) toast("+" + fmtUSD(usd)); }
    else { const bdc = buyBDC(S.usd * pct); if (bdc) toast("+" + fmt(bdc) + " BDC"); }
    return update();
  }
  if (!t.closest(".news-paper")) exchEl.hidden = true;
});
exchEl.addEventListener("input", e => { if (e.target.id === "x-range") { pct = +e.target.value / 100; update(); } });
document.getElementById("exchbtn").addEventListener("click", openExch);
export function marketEvent(ev, pct2) {
  toast(tr(ev === "crash" ? "CRASH: BDC {p}% na hora" : "BDC DISPARA +{p}% na hora", { p: pct2.toFixed(1) }));
  say(ev === "crash" ? "O BDC desabou. Alguém sabia antes. Sempre tem alguém." : "O BDC disparou! Vende agora ou espera mais?", 6000);
  if (!exchEl.hidden) update();
}
setInterval(() => { if (!exchEl.hidden) update(); }, 2000);
