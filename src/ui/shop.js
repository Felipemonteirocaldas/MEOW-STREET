import { BEDB, DESKB, FRIDGEB, O, TVB, pcBoxes } from "../furniture/core.js";
import { OX, OY, T, bbox, box, g, setDrawCtx } from "../engine/draw.js";
import { CATALOG, FURN_UP, buyFurn, buyItem, owns, priceOf, sellItem, sellValue } from "../game/catalog.js";
import { tr } from "../lang.js";
import { fmtUSD } from "../game/market.js";
import { S } from "../game/state.js";
import { toast } from "./overlays.js";
import { FX, FX_ICON } from "../game/catalog-fx.js";
import { fmt } from "../game/production.js";
import { openExch } from "./exchange.js";
import { say } from "../characters/dex.js";

// buy catalog: Sims-style, each item drawn by the same code that draws it in the room
const shopEl = document.getElementById("shop"), shopc = document.getElementById("shopc");
const SHOP_BOXES = { pc: DESKB, cama: BEDB, geladeira: FRIDGEB, tv: TVB };
function thumb(c, bs) {
  const prev = [g, T, OX, OY], ctx = c.getContext("2d"), dpr = window.devicePixelRatio || 1;
  c.width = 96 * dpr; c.height = 80 * dpr;
  setDrawCtx(ctx, 1, 0, 0);
  const [x0, y0, x1, y1] = bbox(bs), s = Math.min(80 / (x1 - x0), 64 / (y1 - y0));
  setDrawCtx(ctx, s, 48 - (x0 + x1) / 2 * s, 40 - (y0 + y1) / 2 * s);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = "#1a1a1e"; ctx.fillRect(0, 0, 96, 80);
  bs.forEach(box);
  setDrawCtx(...prev);
}
SHOP_BOXES.pc = t => pcBoxes(t, 0);
const boxesFor = key => O.filter(o => o.own === key && o.boxes).flatMap(o => o.boxes());
const GLYPH = { rug: "▦", clock: "◷", cork: "✎" }; // wall/floor decor without 3D boxes
let tab = "all";
// the cheapest item that does something (not pure decoration) you don't own yet: a goal to save for
const nextGoal = () => CATALOG.filter(c => !owns(c.key) && (FX[c.key] || []).some(([k]) => k === "need" || k === "prod")).sort((a, b) => a.price - b.price)[0];
const chipsOf = key => (FX[key] || []).map(([k, t]) => `<span class="fx ${k}"><i>${FX_ICON[k]}</i>${tr(t)}</span>`).join("");
function openShop() {
  const rooms = [...new Set(CATALOG.map(c => c.room))], goal = nextGoal();
  const upgrades = Object.entries(FURN_UP).filter(([k]) => k === "pc" || k === "geladeira" || (k === "tv" && owns("tv")) || (k === "cama" && owns("bed")));
  const tabs = [["all", tr("Tudo")], ...rooms.map(r => [r, r]), ["up", tr("Melhorias")]];
  const wallet = `<div class="s-wallet"><div><span class="sub">${tr("Você tem")}</span><b>${fmtUSD(S.usd)}</b></div><div><span class="sub">${tr("em BDC")}</span><b>${fmt(S.cycles)}</b> <span class="sub">≈ ${fmtUSD(S.cycles * S.price)}</span></div>
    <button data-exch class="alt">${tr("Vender BDC")}</button></div>`;
  const goalBox = goal ? `<div class="s-goal">${tr("Próxima meta")}: <b>${goal.name}</b> · ${fmtUSD(priceOf(goal))} · ${S.usd >= priceOf(goal) ? tr("você já pode comprar") : tr("faltam {v}", { v: fmtUSD(priceOf(goal) - S.usd) })}</div>` : "";
  const item = c => {
    const own = owns(c.key), can = S.usd >= priceOf(c);
    return `<div class="shop-item ${own ? "own" : ""}"><canvas data-key="${c.key}"></canvas><div class="name" title="${c.desc}">${c.name}</div><div class="fxs">${chipsOf(c.key)}</div>
      ${own ? `<button class="sell" data-sell="${c.key}">${tr("Vender {v}", { v: fmtUSD(sellValue(c.key)) })}</button>`
            : `<button data-buyi="${c.key}" ${can ? "" : "disabled"}>${fmtUSD(priceOf(c))}${can ? "" : ` <small>${tr("faltam {v}", { v: fmtUSD(priceOf(c) - S.usd) })}</small>`}</button>`}</div>`;
  };
  const roomsHtml = rooms.filter(r => tab === "all" || tab === r).map(room => `<div class="shop-cat"><h3>${room}</h3><div class="shop-row">${CATALOG.filter(c => c.room === room).map(item).join("")}</div></div>`).join("");
  const upHtml = tab === "all" || tab === "up" ? `<div class="shop-cat"><h3>${tr("Melhorias")}</h3><p class="sub">${tr("Melhorias são em sequência: compre o nível anterior primeiro. O PC acelera a linha Hardware; a geladeira, a cama e a TV melhoram as necessidades do Dex.")}</p>` + upgrades.map(([k, f]) => `<div class="shop-row">` + f.tiers.map((name, t) => {
    const own = S.furn[k] >= t, next = S.furn[k] + 1 === t, can = S.usd >= f.cost[t];
    return `<div class="shop-item ${own ? "own" : ""}"><canvas data-k="${k}" data-t="${t}"></canvas><div class="name">${f.name}: ${name}</div><div class="sub">${f.fx[t]}</div>
      ${own ? `<span class="tag">${tr(S.furn[k] === t ? "EM USO" : "SUPERADO")}</span>` : `<button data-shop="${k}" ${!next || !can ? "disabled" : ""}>${fmtUSD(f.cost[t])}${!next ? ` <small>${tr("compre o nível anterior")}</small>` : !can ? ` <small>${tr("faltam {v}", { v: fmtUSD(f.cost[t] - S.usd) })}</small>` : ""}</button>`}</div>`;
  }).join("") + "</div>").join("") + "</div>" : "";
  shopc.innerHTML = `${wallet}${goalBox}<div class="s-tabs">${tabs.map(([k, l]) => `<button data-tab="${k}" class="${tab === k ? "on" : ""}">${l}</button>`).join("")}</div>${roomsHtml}${upHtml}
    <p class="sub">${tr("Revender devolve menos: 75% no dia da compra, caindo 5% ao dia até 40%.")}</p>
    <p class="sub legend"><span class="fx need"><i>${FX_ICON.need}</i>${tr("necessidade do Dex")}</span> <span class="fx prod"><i>${FX_ICON.prod}</i>${tr("produção")}</span> <span class="fx story"><i>${FX_ICON.story}</i>${tr("história")}</span> <span class="fx cozy"><i>${FX_ICON.cozy}</i>${tr("clima")}</span></p>`;
  shopc.querySelectorAll("canvas[data-k]").forEach(c => thumb(c, SHOP_BOXES[c.dataset.k](+c.dataset.t)));
  shopc.querySelectorAll("canvas[data-key]").forEach(c => {
    const bs = boxesFor(c.dataset.key);
    if (bs.length) return thumb(c, bs);
    const x = c.getContext("2d"), dpr = window.devicePixelRatio || 1; c.width = 96 * dpr; c.height = 80 * dpr;
    x.setTransform(dpr, 0, 0, dpr, 0, 0); x.fillStyle = "#1a1a1e"; x.fillRect(0, 0, 96, 80);
    x.fillStyle = "#cfc6b0"; x.font = "38px serif"; x.textAlign = "center"; x.fillText(GLYPH[c.dataset.key] || "?", 48, 54);
  });
  shopEl.hidden = false;
}
shopEl.addEventListener("pointerdown", e => {
  const tb = e.target.closest("[data-tab]"), ex = e.target.closest("[data-exch]"), b = e.target.closest("[data-shop]"), bi = e.target.closest("[data-buyi]"), sl = e.target.closest("[data-sell]");
  if (tb) { tab = tb.dataset.tab; return openShop(); }
  if (ex) { shopEl.hidden = true; return openExch(); }
  if (b) { if (!b.disabled && buyFurn(b.dataset.shop)) { toast("Melhoria instalada"); openShop(); } return; }
  if (bi) { if (!bi.disabled && buyItem(bi.dataset.buyi)) { toast("Comprado"); say("Até que ficou bom."); openShop(); } return; }
  if (sl) { const v = sellItem(sl.dataset.sell); if (v) { toast(tr("Vendido por {v}", { v: fmtUSD(v) })); openShop(); } return; }
  if (e.target === shopEl || e.target.closest(".close")) shopEl.hidden = true;
});
document.getElementById("shopbtn").addEventListener("click", openShop);

