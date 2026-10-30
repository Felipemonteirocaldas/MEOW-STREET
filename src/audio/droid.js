import { OPTS } from "../menu.js";

// R2-DEBT talks in synthesised whistles and chirps (a satire of a certain astromech). Nothing is downloaded: oscillators only.
const AC = window.AudioContext || window.webkitAudioContext;
let ctx;
export function chirp(n = 6, mood = "happy") {
  if (!AC || OPTS.volume <= 0) return;
  try { ctx ||= new AC(); ctx.resume(); } catch (e) { return; }
  let t = ctx.currentTime + 0.02;
  for (let i = 0; i < n; i++) {
    const o = ctx.createOscillator(), g = ctx.createGain(), d = 0.06 + Math.random() * 0.12;
    const a = (mood === "sad" ? 400 : 700) + Math.random() * 1800, b = mood === "sad" ? a * (0.45 + Math.random() * 0.2) : a * (0.6 + Math.random() * 1.8);
    o.type = Math.random() < 0.5 ? "sine" : "square";
    o.frequency.setValueAtTime(a, t); o.frequency.exponentialRampToValueAtTime(Math.max(80, b), t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05 * OPTS.volume, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + d + 0.03); t += d + 0.025;
  }
}
