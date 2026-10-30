import { CH, CW, D, DPR, OX, OY, RH, T, W, ZMAX, ZMIN, view } from "./draw.js";
import { OPTS } from "../menu.js";

// ---------- camera ----------
export const viewM = () => { const ox = CW / 2 - view.fx * view.z, oy = CH / 2 - view.fy * view.z; return [DPR * view.z, 0, 0, DPR * view.z, DPR * ox, DPR * oy]; };
export const toWorld = (sx, sy) => [(sx - (CW / 2 - view.fx * view.z)) / view.z, (sy - (CH / 2 - view.fy * view.z)) / view.z];
export const toScreen = (wx, wy) => [wx * view.z + CW / 2 - view.fx * view.z, wy * view.z + CH / 2 - view.fy * view.z];
export function clampView() {
  view.z = Math.max(ZMIN, Math.min(ZMAX, view.z));
  view.fx = Math.max(OX - D * T, Math.min(OX + W * T, view.fx));
  view.fy = Math.max(OY - RH * T, Math.min(OY + (W + D) / 2 * T, view.fy));
}
export function zoomAt(sx, sy, f) {
  const [wx, wy] = toWorld(sx, sy); view.z = Math.max(ZMIN, Math.min(ZMAX, view.z * f));
  view.fx = wx - (sx - CW / 2) / view.z; view.fy = wy - (sy - CH / 2) / view.z; clampView();
}
export let camAnim = null;
export function zoomTo(p, then) { if (!OPTS.motion) return then(); camAnim = { t: 0, from: { ...view }, to: { z: Math.max(view.z, 5), fx: p[0], fy: p[1] }, then }; }
export function updateCam(dt) {
  const a = camAnim; if (!a) return 0;
  a.t = Math.min(1, a.t + dt / 0.9);
  const k = a.t * a.t * (3 - 2 * a.t);
  view.z = a.from.z * Math.pow(a.to.z / a.from.z, k); view.fx = a.from.fx + (a.to.fx - a.from.fx) * k; view.fy = a.from.fy + (a.to.fy - a.from.fy) * k;
  if (a.t >= 1) { camAnim = null; Object.assign(view, a.from); a.then(); return 0; }
  return Math.max(0, (k - 0.65) / 0.35);
}

