import { c, DUSK, bandedSky, bubble, grad, path, plane, skyline, vacLook } from "./vacation-art.js";
import { figure } from "../characters/figure.js";

// The trip, as four cuts: the door of 4B, a taxi over the bridge, a plane window, the jet crossing the continent. Each scene gets its local time lt (s).
export const SCENES = [["door", 3.6, "Nova York, 1986."], ["taxi", 3.8, "Hora de uma pausa."], ["cabin", 3.6, "Acima das nuvens."], ["jet", 3.8, "Rumo a Pernambuco…"]];
export const TRIP_LEN = SCENES.reduce((a, s) => a + s[1], 0);
const ease = k => k * k * (3 - 2 * k), clamp = k => Math.max(0, Math.min(1, k));

function luggage(dx, fy, u, t, moving) { // suitcase on one side, the cat carrier on the other (two glowing eyes)
  c.fillStyle = "#8b5a2b"; c.beginPath(); c.roundRect(dx + 2.4 * u, fy - 4.4 * u, 3.4 * u, 3.4 * u, 4); c.fill(); c.strokeStyle = "#3a2410"; c.lineWidth = 2; c.strokeRect(dx + 2.6 * u, fy - 4.2 * u, 3 * u, 3 * u);
  c.fillStyle = "#c9b27a"; c.beginPath(); c.roundRect(dx - 6.6 * u, fy - 4.6 * u, 3.6 * u, 3.2 * u, 5); c.fill(); c.strokeStyle = "#555"; c.lineWidth = 1; for (let i = 1; i < 5; i++) { c.beginPath(); c.moveTo(dx - 6.6 * u + i * 0.7 * u, fy - 4.6 * u); c.lineTo(dx - 6.6 * u + i * 0.7 * u, fy - 1.4 * u); c.stroke(); }
  if (Math.sin(t * 3) > -0.9) { c.fillStyle = "#d4e04a"; for (const e of [-5.6, -4.4]) { c.beginPath(); c.arc(dx + e * u, fy - 3.2 * u, 2, 0, 7); c.fill(); } }
}

export function door(lt, w, h) {
  const gy = h * 0.8, hz = h * 0.6, dur = SCENES[0][1];
  bandedSky(0, hz, DUSK.sky, w); skyline(w, gy, h, 0, 0.55);
  const bw = Math.min(w * 0.46, 440), bx = w * 0.1, top = h * 0.08, doorX = bx + bw * 0.5, doorH = 150, base = gy - 34;
  c.fillStyle = "#8a3f3a"; c.fillRect(bx, top, bw, gy - top); c.fillStyle = "#6e2f2f"; c.fillRect(bx - 8, top - 14, bw + 16, 16);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) { const wx = bx + bw * (0.1 + i * 0.3), wy = top + 36 + j * ((base - top - 220) / 3.2); c.fillStyle = (i * 7 + j * 3) % 3 ? "#ffd86a" : "#2a1630"; c.fillRect(wx, wy, bw * 0.2, 56); c.fillStyle = "#5c2424"; c.fillRect(wx - 4, wy + 56, bw * 0.2 + 8, 6); }
  c.strokeStyle = "#0e0e1a"; c.lineWidth = 3; for (let j = 0; j < 3; j++) { const y = top + 98 + j * 94; c.beginPath(); c.moveTo(bx + bw * 0.04, y); c.lineTo(bx + bw * 0.96, y); c.moveTo(bx + bw * 0.04, y); c.lineTo(bx + bw * 0.14, y + 40); c.lineTo(bx + bw * 0.24, y); c.stroke(); } // fire escape
  const open = ease(clamp((lt - 0.3) / 0.6));
  c.fillStyle = "#1a1030"; c.beginPath(); c.roundRect(doorX - 38, base - doorH, 76, doorH, [38, 38, 0, 0]); c.fill();
  c.fillStyle = "#ffcf7a"; c.beginPath(); c.roundRect(doorX - 34, base - doorH + 4, 68, doorH - 4, [34, 34, 0, 0]); c.fill();
  c.fillStyle = "#2d6a6a"; c.beginPath(); c.roundRect(doorX - 34, base - doorH + 4, 68 * (1 - open * 0.85), doorH - 4, [34, 4, 0, 0]); c.fill();
  c.fillStyle = "#e8b923"; c.font = "700 12px sans-serif"; c.fillText("4B", doorX - 8, base - doorH - 8);
  for (let i = 0; i < 3; i++) { c.fillStyle = "#a89a8a"; c.fillRect(doorX - 50 - i * 8, base + i * 12, 100 + i * 16, 12); }
  c.fillStyle = "#26325e"; c.fillRect(0, gy, w, h - gy); c.fillStyle = "#4a62a8"; c.fillRect(0, gy, w, 6);
  const lx = w * 0.88; c.fillStyle = "#10142e"; c.fillRect(lx - 3, gy - 190, 6, 200); c.fillRect(lx - 40, gy - 192, 44, 5); // street lamp
  const lg = c.createRadialGradient(lx - 36, gy - 184, 4, lx - 36, gy - 184, 90); lg.addColorStop(0, "rgba(255,224,130,.9)"); lg.addColorStop(1, "rgba(255,200,100,0)"); c.fillStyle = lg; c.fillRect(lx - 130, gy - 280, 190, 190);
  if (lt > 0.5) {
    const p = clamp((lt - 0.5) / (dur - 0.9)), dx = doorX + ease(p) * (w * 0.74 - doorX), fy = base + ease(clamp(p * 2.5)) * 70 - Math.abs(Math.sin(lt * 9)) * 2, u = 10;
    c.fillStyle = "rgba(0,0,0,.3)"; c.beginPath(); c.ellipse(dx, base + 72, 40, 8, 0, 0, 7); c.fill();
    figure(c, dx, fy, u, { look: vacLook(), front: true, sit: false, swing: Math.sin(lt * 9), nude: false, now: 0, bat: false, shades: true }); luggage(dx, fy, u, lt, true);
    if (p > 0.15 && p < 0.55) bubble("Miau? (Pernambuco?)", dx - 2 * u, fy - 16.5 * u);
  }
}

export function taxi(lt, w, h) {
  const hz = h * 0.5, gy = h * 0.78, deckY = gy - 24;
  bandedSky(0, hz, DUSK.sky, w); c.fillStyle = "#1b86c8"; c.fillRect(0, hz, w, h * 0.05); c.fillStyle = "#4fb4e6"; c.fillRect(0, hz, w, 3);
  skyline(w, hz + h * 0.05, h, lt * 14, 0.7); // far layer
  c.fillStyle = "#0e1a42"; c.fillRect(0, hz + h * 0.05, w, deckY - hz - h * 0.05);
  const span = w * 0.9, ts = []; for (let i = -1; i < 3; i++) ts.push(((i * span - lt * 70) % (span * 3) + span * 3) % (span * 3) - span); // bridge towers, mid layer
  ts.sort((a, b) => a - b);
  for (const tx of ts) {
    c.fillStyle = "#1c2f6a"; for (const s of [-1, 1]) c.fillRect(tx + s * 30 - 12, deckY - h * 0.36, 24, h * 0.36);
    c.beginPath(); c.moveTo(tx - 42, deckY - h * 0.36); c.lineTo(tx + 42, deckY - h * 0.36); c.lineTo(tx + 42, deckY - h * 0.28); c.lineTo(tx - 42, deckY - h * 0.28); c.fill();
    c.beginPath(); c.arc(tx, deckY - h * 0.2, 22, Math.PI, 0); c.lineTo(tx + 22, deckY - h * 0.1); c.lineTo(tx - 22, deckY - h * 0.1); c.fill();
  }
  c.strokeStyle = "#2f4a96"; c.lineWidth = 2; for (let i = 0; i + 1 < ts.length; i++) { const a = ts[i], b = ts[i + 1], top = deckY - h * 0.36; c.beginPath(); c.moveTo(a, top); c.quadraticCurveTo((a + b) / 2, deckY - 10, b, top); c.stroke(); for (let x = a + 30; x < b - 20; x += 36) { const k = (x - a) / (b - a), y = (1 - k) * (1 - k) * top + 2 * (1 - k) * k * (deckY - 10) + k * k * top; c.beginPath(); c.moveTo(x, y); c.lineTo(x, deckY); c.stroke(); } }
  c.fillStyle = "#26325e"; c.fillRect(0, deckY, w, h - deckY); c.fillStyle = "#4a62a8"; c.fillRect(0, deckY, w, 5);
  c.fillStyle = "rgba(255,226,90,.7)"; for (let x = -((lt * 520) % 140); x < w; x += 140) c.fillRect(x, gy + (h - gy) * 0.5, 70, 5);
  c.fillStyle = "rgba(255,226,120,.55)"; for (let i = 0; i < 16; i++) c.fillRect((((i * 131 - lt * (380 + i % 4 * 90)) % (w + 120)) + w + 120) % (w + 120) - 60, hz - 40 + (i * 53) % 150, 28 + i % 3 * 16, 2); // light streaks
  c.save(); c.translate(w * 0.46, gy + 56 + Math.sin(lt * 17) * 1.2); c.scale(1.5, 1.5); // the taxi, with Dex's straw hat and the cat in the back window
  c.fillStyle = "#f2c200"; c.beginPath(); c.roundRect(-70, -54, 140, 40, 8); c.fill(); c.beginPath(); c.roundRect(-40, -80, 80, 34, 8); c.fill();
  c.fillStyle = "#8ecae6"; c.fillRect(-34, -74, 30, 22); c.fillRect(2, -74, 30, 22); c.fillStyle = "#0b0b1a"; c.beginPath(); c.ellipse(-19, -52, 17, 4, 0, Math.PI, 0); c.fill(); c.beginPath(); c.arc(-19, -58, 9, Math.PI, 0); c.fill(); c.fillRect(-28, -58, 18, 6); // sombrero silhouette
  c.fillStyle = "#d4e04a"; for (const e of [12, 20]) { c.beginPath(); c.arc(e, -62, 2, 0, 7); c.fill(); }
  c.fillStyle = "#111"; c.fillRect(-12, -90, 24, 10); c.fillStyle = "#f2c200"; c.font = "700 8px sans-serif"; c.fillText("TAXI", -10, -82);
  for (const wx of [-42, 42]) { c.fillStyle = "#111"; c.beginPath(); c.arc(wx, -14, 12, 0, 7); c.fill(); c.strokeStyle = "#999"; c.lineWidth = 2; c.beginPath(); c.moveTo(wx + Math.cos(lt * 26) * 9, -14 + Math.sin(lt * 26) * 9); c.lineTo(wx - Math.cos(lt * 26) * 9, -14 - Math.sin(lt * 26) * 9); c.stroke(); }
  c.restore();
  for (let x = -((lt * 360) % 300); x < w + 300; x += 300) { c.fillStyle = "#10142e"; c.fillRect(x, gy - 170, 5, 220); c.fillRect(x, gy - 172, 40, 5); const g = c.createRadialGradient(x + 38, gy - 165, 3, x + 38, gy - 165, 70); g.addColorStop(0, "rgba(255,224,130,.8)"); g.addColorStop(1, "rgba(255,200,100,0)"); c.fillStyle = g; c.fillRect(x - 40, gy - 240, 160, 150); } // foreground lamps
}

export function cabin(lt, w, h) {
  c.fillStyle = grad(0, h, [[0, "#26356e"], [1, "#141b3e"]]); c.fillRect(0, h * 0.05, w, h);
  const ww = Math.min(w * 0.34, 330), wh = h * 0.5, wx = w * 0.62 - ww / 2, wy = h * 0.14;
  c.save(); c.beginPath(); c.roundRect(wx, wy, ww, wh, ww * 0.45); c.clip();
  bandedSky(wy, wy + wh, ["#0a1670", "#102090", "#1c3cb8", "#2e62dc", "#4a82e6", "#7aaeee", "#b4dcf6", "#ffd9b0"], w);
  c.fillStyle = "#fff"; for (let i = 0; i < 5; i++) { const x = wx + ww - ((lt * 160 + i * 130) % (ww + 160)) + 80, y = wy + wh * (0.18 + (i % 4) * 0.2); c.beginPath(); c.roundRect(x - 50, y, 100, 8, 4); c.roundRect(x - 25, y - 7, 60, 8, 4); c.fill(); }
  c.fillStyle = "#adb5bd"; path([[wx - 20, wy + wh * 0.92], [wx + ww * 0.9, wy + wh * 0.7], [wx + ww * 1.1, wy + wh * 0.76], [wx + ww * 0.2, wy + wh * 1.06]], 1); c.fill(); if (Math.sin(lt * 6) > 0) { c.fillStyle = "#ff3b3b"; c.beginPath(); c.arc(wx + ww * 0.95, wy + wh * 0.73, 4, 0, 7); c.fill(); } // the wing, with its red light
  c.fillStyle = "#e8e2d8"; c.fillRect(wx, wy, ww, wh * 0.18 + Math.sin(lt) * 4); // the shade, half pulled down
  c.restore();
  c.strokeStyle = "#e8e2d8"; c.lineWidth = 14; c.beginPath(); c.roundRect(wx, wy, ww, wh, ww * 0.45); c.stroke(); c.strokeStyle = "#b8b2a8"; c.lineWidth = 3; c.beginPath(); c.roundRect(wx + 8, wy + 8, ww - 16, wh - 16, ww * 0.4); c.stroke();
  const sy = h * 0.66; c.fillStyle = "#1b2656"; c.beginPath(); c.roundRect(w * 0.08, sy, w * 0.34, h, 30); c.fill(); c.beginPath(); c.roundRect(w * 0.74, sy + 30, w * 0.22, h, 30); c.fill();
  const u = 12, hx = w * 0.25; c.save(); c.beginPath(); c.rect(0, 0, w, sy + 10); c.clip(); figure(c, hx, sy + 3.9 * u + Math.sin(lt * 1.3) * 2, u, { look: vacLook(), front: false, sit: true, swing: 0, nude: false, now: 0, bat: false, shades: true }); c.restore(); // Dex from behind, sombrero and all
  c.fillStyle = "#c9b27a"; c.beginPath(); c.roundRect(w * 0.78, sy - 56, 110, 80, 8); c.fill(); c.strokeStyle = "#555"; c.lineWidth = 1; for (let i = 1; i < 7; i++) { c.beginPath(); c.moveTo(w * 0.78 + i * 15, sy - 56); c.lineTo(w * 0.78 + i * 15, sy + 24); c.stroke(); }
  if (Math.sin(lt * 2.4) > -0.8) { c.fillStyle = "#d4e04a"; for (const e of [34, 66]) { c.beginPath(); c.arc(w * 0.78 + e, sy - 24, 5, 0, 7); c.fill(); } }
  c.fillStyle = "rgba(255,255,255,.85)"; c.font = "700 20px 'Special Elite', monospace"; for (let i = 0; i < 3; i++) { const k = ((lt * 0.5 + i / 3) % 1); c.globalAlpha = 1 - k; c.fillText("z", hx + 60 + k * 30 + i * 6, sy - 150 - k * 70); } c.globalAlpha = 1;
}

export function jet(lt, w, h, P) {
  bandedSky(0, h, P.sky.length === 9 ? P.sky : DUSK.sky, w);
  c.fillStyle = "#fff"; for (let i = 0; i < 6; i++) { const x = ((i * 0.21 * w - lt * 55 + w * 2) % (w + 260)) - 130, y = h * (0.12 + (i % 4) * 0.17); c.beginPath(); c.roundRect(x - 60, y, 120, 9, 5); c.roundRect(x - 30, y - 8, 70, 9, 5); c.fill(); }
  const p = lt / SCENES[3][1]; plane(-150 + p * (w + 300), h * 0.36 - p * 36, lt, true);
  const x0 = w * 0.14, x1 = w * 0.86, y0 = h * 0.82, mx = (x0 + x1) / 2; // route map: JFK to ACA, dashed, with a dot that travels
  c.strokeStyle = "rgba(255,255,255,.75)"; c.lineWidth = 2; c.setLineDash([6, 8]); c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(mx, y0 - h * 0.18, x1, y0 + 20); c.stroke(); c.setLineDash([]);
  c.fillStyle = "#fff"; for (const [x, y] of [[x0, y0], [x1, y0 + 20]]) { c.beginPath(); c.arc(x, y, 5, 0, 7); c.fill(); }
  c.font = "700 14px 'Special Elite', monospace"; c.fillText("JFK", x0 - 12, y0 + 24); c.fillText("REC", x1 - 12, y0 + 44);
  const k = ease(p), px = (1 - k) * (1 - k) * x0 + 2 * (1 - k) * k * mx + k * k * x1, py = (1 - k) * (1 - k) * y0 + 2 * (1 - k) * k * (y0 - h * 0.18) + k * k * (y0 + 20);
  c.fillStyle = "#e8b923"; c.beginPath(); c.arc(px, py, 6, 0, 7); c.fill();
}
