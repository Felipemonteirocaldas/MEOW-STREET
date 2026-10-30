import { createShell } from "./win98/shell.js";
import { APPS } from "./win98/apps.js";
import { busy, dex, say } from "../characters/dex.js";
import { flag } from "../game/state.js";
import { powerCut } from "../game/bills.js";

// The PC: zoom into the monitor, then a Meow OS 98 desktop (windows, Meow Explorer through /proxy, Minesweeper...) on a CRT.
const el = document.getElementById("pc"), fit = el.querySelector(".pc-fit"), mon = el.querySelector(".pc-monitor"), screen = document.getElementById("pcs");
const NW = 712, NH = 626; // the monitor's natural size; scaled down to whatever room the window has
let shell = null;

// phones in portrait: no beige monitor (it would shrink the screen to postage-stamp size); the Windows screen fills the display at real size
const phone = () => innerWidth < 700 && innerHeight > innerWidth;
function fitMonitor() {
  el.classList.toggle("pc-phone", phone());
  const w = phone() ? Math.min(innerWidth - 12, 520) : 640, h = phone() ? Math.min(innerHeight - 64, 760) : 480;
  screen.style.setProperty("--w", w + "px"); screen.style.setProperty("--h", h + "px");
  document.querySelector(".pc-tube").style.cssText = `width:${w}px;height:${h}px`;
  const nw = phone() ? w : NW, nh = phone() ? h : NH, s = phone() ? 1 : Math.min((innerWidth - 24) / nw, (innerHeight - 24) / nh, 1.6);
  fit.style.width = nw * s + "px"; fit.style.height = nh * s + "px"; mon.style.width = nw + "px"; mon.style.height = nh + "px"; mon.style.transform = `scale(${s})`;
}
export function openPC() {
  flag("pc");
  if (powerCut()) { say("Sem luz, sem PC. Ótimo."); return false; }
  el.hidden = false; fitMonitor();
  busy(3.6e6, () => {}, "work"); // Dex stays put while the PC is on
  if (!shell) { shell = createShell(screen, APPS, { shutdown: () => { shell = null; screen.innerHTML = ""; closePC(); } }); shell.boot().then(() => APPS.find(a => a.id === "ai")?.greet(shell)); }
  return true;
}
export function closePC() { el.hidden = true; dex.busy = null; dex.idle = 6; }

addEventListener("resize", () => { if (!el.hidden) fitMonitor(); });
el.addEventListener("pointerdown", e => { if (e.target === el) closePC(); }); // click outside the monitor
document.getElementById("pcoff").addEventListener("click", closePC);
el.addEventListener("ovclose", closePC); // Esc / ✕ / Back from overlay-kit.js
