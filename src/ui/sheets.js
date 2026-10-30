import { renderNews } from "./news-panel.js";
import { renderLines } from "./production-panel.js";
import { flag } from "../game/state.js";
import { CW, g } from "../engine/draw.js";

// bottom-tab sheets (production, news)
for (const [btn, id] of [["prodbtn", "prod"], ["newsbtn", "newsov"]]) {
  const el = document.getElementById(id);
  document.getElementById(btn).addEventListener("click", () => { el.hidden = false; id === "newsov" ? (flag("news"), renderNews()) : renderLines(); });
  el.addEventListener("pointerdown", e => { if (e.target === el || e.target.closest(".close")) el.hidden = true; });
}

export function bubble(text, x, y) { // speech bubble: upright Inter at 15px, roomy padding and line height, soft shadow; readable at a glance
  g.font = "600 15px Inter, system-ui, sans-serif"; const pad = 10, lh = 20, maxW = Math.min(260, CW - 32), lines = [];
  let cur = "";
  for (const w of text.split(" ")) { const t = cur ? cur + " " + w : w; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  lines.push(cur);
  const bw = Math.max(...lines.map(l => g.measureText(l).width)) + pad * 2, bh = lines.length * lh + pad * 2 - 4;
  const bx = Math.max(6, Math.min(x - bw / 2, CW - bw - 6)), by = Math.max(4, y - bh - 12), tx = Math.max(bx + 12, Math.min(x, bx + bw - 12));
  g.save(); g.shadowColor = "rgba(0,0,0,.45)"; g.shadowBlur = 10; g.shadowOffsetY = 2;
  g.fillStyle = "#f4f0e6"; g.beginPath(); g.roundRect(bx, by, bw, bh, 9); g.moveTo(tx - 7, by + bh - 1); g.lineTo(tx, by + bh + 8); g.lineTo(tx + 7, by + bh - 1); g.fill(); g.restore();
  g.strokeStyle = "#111"; g.lineWidth = 1.2; g.beginPath(); g.roundRect(bx, by, bw, bh, 9); g.stroke();
  g.fillStyle = "#15151a"; g.textBaseline = "alphabetic"; lines.forEach((l, i) => g.fillText(l, bx + pad, by + pad + 13 + i * lh));
}

