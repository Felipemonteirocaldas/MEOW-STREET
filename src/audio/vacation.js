import { OPTS } from "../menu.js";

// Sound for the Pernambuco vacation, all synthesised (no files): surf, breeze, crickets at night, engines, gulls, a baião loop (zabumba, bass and a pentatonic riff)
// and one-shot effects for the beach taps. Respects the volume in Options and a mute button of its own.
const AC = window.AudioContext || window.webkitAudioContext;
let ctx, master, nb, bus, running = false, nextBar = 0, step = 0, timers = [], scene = "", muted = false;
try { muted = localStorage.getItem("bd-vacsnd") === "0"; } catch (e) {}
const level = () => (muted ? 0 : OPTS.volume) * 0.9;
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
const LEVELS = { door: { traffic: 0.22, music: 0.5 }, taxi: { engine: 0.1, traffic: 0.3, music: 0.5 }, cabin: { engine: 0.24, music: 0.35 }, jet: { engine: 0.16, music: 0.5 }, beach: { surf: 1, breeze: 0.5, music: 0.8 } };
const CHORDS = [[50, 54, 57, 62], [48, 52, 55, 60], [43, 47, 50, 55], [50, 54, 57, 62]], BEAT = 0.56, RIFF = [74, 76, 78, 81, 83];

function noise(type, f, q) { // looping noise through a filter, into its own bus gain (0 until a scene asks for it)
  const s = ctx.createBufferSource(); s.buffer = nb; s.loop = true;
  const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
  const g = ctx.createGain(); g.gain.value = 0; s.connect(fl).connect(g).connect(master); s.start(); return g;
}
function init() {
  if (ctx || !AC) return !!ctx;
  try { ctx = new AC(); } catch (e) { return false; }
  master = ctx.createGain(); master.connect(ctx.destination);
  nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const surf = noise("lowpass", 700, 0.7), lfo = ctx.createOscillator(), lg = ctx.createGain(); // surf: noise whose level swells like waves
  const surfBus = ctx.createGain(); surfBus.gain.value = 0; surf.disconnect(); surf.gain.value = 0.2; surf.connect(surfBus).connect(master);
  lfo.frequency.value = 0.13; lg.gain.value = 0.16; lfo.connect(lg).connect(surf.gain); lfo.start();
  const eng = noise("lowpass", 260, 0.5), saw = ctx.createOscillator(), sg = ctx.createGain(); // engines: rumble plus a low saw
  saw.type = "sawtooth"; saw.frequency.value = 58; sg.gain.value = 0.03; saw.connect(sg).connect(eng); saw.start(); eng.gain.value = 0;
  const cri = ctx.createOscillator(), cg = ctx.createGain(), cb = ctx.createGain(), cl = ctx.createOscillator(), clg = ctx.createGain(); // crickets: a 4.2 kHz tone pulsed at 14 Hz
  cri.frequency.value = 4200; cl.type = "square"; cl.frequency.value = 14; clg.gain.value = 0.008; cg.gain.value = 0.008; cl.connect(clg).connect(cg.gain); cri.connect(cg).connect(cb).connect(master); cb.gain.value = 0; cri.start(); cl.start();
  const music = ctx.createGain(); music.gain.value = 0; music.connect(master);
  bus = { surf: surfBus, breeze: noise("bandpass", 900, 0.5), engine: eng, traffic: noise("lowpass", 500, 0.4), crickets: cb, music };
  return true;
}
function tone(f, t, dur, type, vol, dest) {
  const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g).connect(dest); o.start(t); o.stop(t + dur + 0.05);
}
function thump(t) { // zabumba: a sine that drops fast in pitch
  const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
  g.gain.setValueAtTime(0.16, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2); o.connect(g).connect(bus.music); o.start(t); o.stop(t + 0.22);
}
function bar() { // one bar of baião (D, C, G, D): pad, bass and zabumba on the baião pattern, a loose pentatonic riff on top
  const ch = CHORDS[step % 4], t = nextBar, m = bus.music, root = ch[0] - 12;
  for (const n of ch) tone(hz(n), t, BEAT * 4.2, "sine", 0.025, m);
  for (const [b, n] of [[0, root], [1.5, root + 7], [2, root], [3.5, root + 7]]) { tone(hz(n), t + b * BEAT, BEAT * 0.9, "triangle", 0.07, m); thump(t + b * BEAT); }
  for (let i = 0; i < 8; i++) if (Math.random() < 0.75) tone(hz(RIFF[Math.floor(Math.random() * RIFF.length)]), t + i * BEAT / 2, 0.3, "triangle", 0.032, m);
  nextBar += BEAT * 4; step++;
}
const wait = (ms, f) => { const id = setTimeout(f, ms); timers.push(id); };
function gullLoop() { if (!running) return; if (scene === "beach") sfx("gull"); wait(7000 + Math.random() * 9000, gullLoop); }

export function sfx(name) {
  if (!ctx || !running) return; const t = ctx.currentTime;
  if (name === "clink") { tone(2400, t, 0.25, "sine", 0.12, master); tone(3600, t + 0.02, 0.18, "sine", 0.08, master); }
  else if (name === "ding") { tone(1046, t, 0.6, "sine", 0.12, master); tone(784, t + 0.45, 0.8, "sine", 0.12, master); }
  else if (name === "gull") for (let i = 0; i < 2; i++) { const o = ctx.createOscillator(), g = ctx.createGain(), s = t + i * 0.4; o.frequency.setValueAtTime(1700, s); o.frequency.linearRampToValueAtTime(1100, s + 0.18); o.frequency.linearRampToValueAtTime(1500, s + 0.34); g.gain.setValueAtTime(0.0001, s); g.gain.linearRampToValueAtTime(0.05, s + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, s + 0.36); o.connect(g).connect(master); o.start(s); o.stop(s + 0.4); }
  else { // noise one-shots: purr (low, pulsing), splash (band, decaying), click (short, bright)
    const s = ctx.createBufferSource(); s.buffer = nb; const f = ctx.createBiquadFilter(), g = ctx.createGain(); s.connect(f).connect(g).connect(master);
    if (name === "purr") { f.type = "lowpass"; f.frequency.value = 160; const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 24; lg.gain.value = 0.25; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.35, t + 0.2); g.gain.linearRampToValueAtTime(0.0001, t + 1.8); l.connect(lg).connect(g.gain); l.start(t); l.stop(t + 1.8); s.start(t); s.stop(t + 1.8); }
    else if (name === "splash") { f.type = "bandpass"; f.frequency.value = 1300; g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7); s.start(t); s.stop(t + 0.7); }
    else { f.type = "highpass"; f.frequency.value = 3000; g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06); s.start(t); s.stop(t + 0.08); }
  }
}
function apply() { if (!bus) return; const L = LEVELS[scene] || {}, t = ctx.currentTime; master.gain.setTargetAtTime(level(), t, 0.2); for (const k in bus) bus[k].gain.setTargetAtTime(L[k] || 0, t, 0.7); }
export const vacAudio = {
  start() { if (!init()) return; ctx.resume(); if (running) return; running = true; nextBar = ctx.currentTime + 0.1; step = 0; apply(); bar(); timers.push(setInterval(() => { if (ctx.currentTime + 1.5 > nextBar) bar(); }, 500)); wait(5000, gullLoop); },
  stop() { running = false; timers.forEach(id => { clearTimeout(id); clearInterval(id); }); timers = []; if (ctx) { master.gain.setTargetAtTime(0, ctx.currentTime, 0.1); setTimeout(() => ctx.suspend(), 400); } },
  scene(name) { if (name === scene) return; scene = name; if (ctx && running) apply(); if (name === "cabin") sfx("ding"); },
  night(n) { if (bus && running && scene === "beach") bus.crickets.gain.setTargetAtTime(Math.max(0, n - 0.4) * 1.2, ctx.currentTime, 1); },
  resume() { if (ctx && running) ctx.resume(); },
  toggle() { muted = !muted; try { localStorage.setItem("bd-vacsnd", muted ? "0" : "1"); } catch (e) {} if (ctx && running) apply(); return !muted; },
  on: () => !muted,
};
