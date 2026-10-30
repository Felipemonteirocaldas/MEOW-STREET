import { S } from "../../../game/state.js";
import { activeMods, fmt, totalRate } from "../../../game/production.js";
import { fmtUSD } from "../../../game/market.js";

// R2-DEBT Miner: the game's economy as a properties sheet
export const miner = {
  id: "miner", name: "R2-DEBT Miner", icon: "miner", desktop: true, menu: true,
  open(shell) {
    let timer;
    shell.openWindow({ id: "miner", title: "R2-DEBT Miner", ico: "miner", w: 300, h: 214, x: 280, y: 60, fixed: true,
      onClose: () => clearInterval(timer),
      render(body) {
        const paint = () => {
          const row = (k, v) => `<div class="row"><span>${k}</span><b>${v}</b></div>`;
          body.innerHTML = `<div class="info sunken" style="flex:1;margin:4px"><h4>R2-DEBT Personal Computer</h4>${row("Balance", fmt(S.cycles) + " BDC")}${row("Mining rate", fmt(totalRate()) + " BDC/s")}
            ${row("BDC price", fmtUSD(S.price))}${row("Cash", fmtUSD(S.usd))}${row("Active headlines", activeMods().length)}${row("Hardware / Software / Data", `${S.levels.hardware} / ${S.levels.software} / ${S.levels.dados}`)}
            <p style="margin:8px 0 0;color:#444">Buy upgrades from the Production tab. The headlines you see online move the market.</p></div>`;
        };
        paint(); timer = setInterval(paint, 1000);
      } });
  },
};
