import { LINES, S, esc, gameOver, now, save } from "./state.js";
import { tr } from "../lang.js";
import { owns } from "./catalog.js";
import { fetchWorld, fmt, totalRate } from "./production.js";
import { renderLines } from "../ui/production-panel.js";
import { renderNews } from "../ui/news-panel.js";
import { billsTick } from "./bills.js";
import { trashTick } from "./mess.js";
import { decayNeeds } from "./needs.js";
import { renderHud } from "../ui/hud.js";
import { fmtUSD } from "./market.js";



setInterval(() => {
  if (gameOver || S.vacation) return;
  const t = now(), dt = Math.min((t - S.last) / 1000, 5);
  const gained = totalRate() * dt; S.cycles += gained; S.run.mined += gained; S.last = t;
  billsTick(); trashTick(); decayNeeds(dt); renderHud();
  document.getElementById("cycles").textContent = fmt(S.cycles) + " BDC";
  document.getElementById("usd").textContent = fmtUSD(S.usd);
  const h = S.hist, up = h.length < 2 || h[h.length - 1] >= h[h.length - 2];
  document.getElementById("rate").innerHTML = `${fmt(totalRate())} BDC/s · 1 BDC = <span class="${up ? "up" : "down"}">${fmtUSD(S.price)} ${up ? "▲" : "▼"}</span>`;
  renderLines();
}, 250);
setInterval(save, 5000);
setInterval(fetchWorld, 30000);
setInterval(renderNews, 30000);
fetchWorld();

