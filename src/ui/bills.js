import { DAY, S, now } from "../game/state.js";
import { say } from "../characters/dex.js";
import { tr } from "../lang.js";
import { fmtUSD } from "../game/market.js";
import { payBill } from "../game/bills.js";
import { toast } from "./overlays.js";

// bills under the door
const billsEl = document.getElementById("bills"), billsc = document.getElementById("billsc");
export function openBills() {
  if (!S.bills.length) { billsEl.hidden = true; return say("Nenhuma conta. Por enquanto."); }
  billsc.innerHTML = `<div class="mast" style="font-size:26px">${tr("Contas a pagar")}</div>` + S.bills.map(b => {
    const late = now() > b.due, days = Math.ceil((b.due - now()) / DAY);
    return `<div class="bill"><div><b>${tr(b.kind)}</b><div class="sub">${late ? `<span class='down'>${tr("VENCIDA")}</span>` : tr("vence em {d} dia(s)", { d: days })}</div></div>
      <button data-pay="${b.id}" ${S.usd < b.amount ? "disabled" : ""}>${fmtUSD(b.amount)}</button></div>`;
  }).join("") + `<p class="sub">${tr("Contas se pagam em dólar: venda BDC na corretora. Luz vencida corta a energia (produção ×0,3). Aluguel atrasado acaba com o ânimo do Dex.")}</p>`;
  billsEl.hidden = false;
}
billsEl.addEventListener("pointerdown", e => {
  const b = e.target.closest("[data-pay]");
  if (b) { if (payBill(+b.dataset.pay)) { toast("Conta paga"); openBills(); } return; }
  if (!e.target.closest(".news-paper")) billsEl.hidden = true;
});

