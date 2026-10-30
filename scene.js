// Noir isometric apartment (5 rooms), drawn procedurally. Pinch/drag/wheel camera; tap the floor to walk, tap things to use them.
const cv = document.getElementById("scene"), dk = document.createElement("canvas"), dg = dk.getContext("2d");
let g = cv.getContext("2d"); // swapped temporarily when drawing catalog thumbnails
const W = 12, D = 10, RH = 2.6, IH = 0.4; // apartment size in tiles; outer and cut-away inner wall heights (low, so they never hide furniture)
let T = 20, OX = 0, OY = 0, CW = 0, CH = 0, DPR = 1;
const view = { z: 1.9, fx: 0, fy: 0 }; // world point (fx, fy) sits at the canvas centre
const ZMIN = 0.8, ZMAX = 8;

function resize() {
  DPR = window.devicePixelRatio || 1;
  CW = cv.clientWidth; CH = cv.clientHeight;
  cv.width = CW * DPR; cv.height = CH * DPR; dk.width = cv.width; dk.height = cv.height;
  T = CW / (W + D + 1); OX = CW / 2 - T; OY = RH * T + T * 0.6;
  [view.fx, view.fy] = P(dex.x, dex.y, 0.6);
}

const P = (x, y, z = 0) => [OX + (x - y) * T, OY + (x + y) * T / 2 - z * T];
function poly(pts, fill, stroke) {
  g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath();
  if (HL) { g.fillStyle = HL; g.fill(); return; } // highlight: a soft tint over the object's faces, no edge lines
  g.fillStyle = fill; g.fill();
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = Math.max(0.5, T * 0.025); g.lineJoin = "round"; g.stroke(); }
}
function line(a, b, color, w = 1) {
  g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.strokeStyle = color; g.lineWidth = w; g.stroke();
}
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16), c = s => Math.min(255, Math.round(((n >> s) & 255) * f));
  return `rgb(${c(16)},${c(8)},${c(0)})`;
}
const EDGE = "rgba(0,0,0,.6)"; // inked outlines keep every object readable in the dark
function box(b) {
  if (b.shape === "cyl") return cyl(b);
  const { x, y, z = 0, w, d, h, c } = b;
  poly([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)], shade(c, 0.82), EDGE);
  poly([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)], shade(c, 0.64), EDGE);
  poly([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], shade(c, 1.12), EDGE);
}
// Rounded solid inscribed in the box footprint: cylinder, or a cone/bowl when taper != 1 (bottom radius = top × taper).
// inner: colour of a recessed top (water in a bowl, a hole), drawn as a smaller ellipse.
function cyl({ x, y, z = 0, w, d, h, c, taper = 1, inner, drain }) {
  const cx = x + w / 2, cy = y + d / 2, R = Math.min(w, d) / 2 * T * Math.SQRT2, rb = R * taper;
  const [bx, by] = P(cx, cy, z), [tx, ty] = P(cx, cy, z + h);
  const gr = g.createLinearGradient(tx - R, 0, tx + R, 0);
  gr.addColorStop(0, shade(c, 0.98)); gr.addColorStop(0.45, shade(c, 0.82)); gr.addColorStop(1, shade(c, 0.55));
  g.beginPath(); g.moveTo(tx - R, ty); g.lineTo(bx - rb, by); g.ellipse(bx, by, rb, rb / 2, 0, Math.PI, 0, true); g.lineTo(tx + R, ty); g.closePath();
  if (HL) { g.fillStyle = HL; g.fill(); g.beginPath(); g.ellipse(tx, ty, R, R / 2, 0, 0, 7); g.fill(); return; }
  g.fillStyle = gr; g.fill(); g.strokeStyle = EDGE; g.lineWidth = Math.max(0.5, T * 0.025); g.stroke();
  g.beginPath(); g.ellipse(tx, ty, R, R / 2, 0, 0, 7); g.fillStyle = shade(c, 1.15); g.fill(); g.stroke();
  if (inner) { // a recess seen from above: shaded inner wall, the bottom (water, coffee, drain) sits low and small inside the rim
    g.save(); g.beginPath(); g.ellipse(tx, ty, R * 0.8, R * 0.38, 0, 0, 7); g.clip();
    g.fillStyle = shade(c, 0.5); g.fill();
    g.beginPath(); g.ellipse(tx, ty - R * 0.12, R * 0.8, R * 0.38, 0, 0, 7); g.fillStyle = shade(c, 0.78); g.fill(); // lit far wall
    g.beginPath(); g.ellipse(tx, ty + R * 0.16, R * 0.48, R * 0.2, 0, 0, 7); g.fillStyle = inner; g.fill();
    if (drain) { // a small chrome drain in the porcelain bottom
      g.beginPath(); g.ellipse(tx, ty + R * 0.17, R * 0.1, R * 0.045, 0, 0, 7); g.fillStyle = "#b8bec4"; g.fill();
      g.beginPath(); g.ellipse(tx, ty + R * 0.17, R * 0.055, R * 0.024, 0, 0, 7); g.fillStyle = "#111"; g.fill();
    }
    g.restore();
    g.beginPath(); g.ellipse(tx, ty, R * 0.8, R * 0.38, 0, 0, 7); g.strokeStyle = "rgba(0,0,0,.45)"; g.lineWidth = Math.max(0.5, T * 0.02); g.stroke();
  }
}
const bowlBottom = (cx, cy, z, r) => { const [x, y] = P(cx, cy, z); return [x, y + r * T * Math.SQRT2 * 0.16]; }; // where cyl() draws the inner bottom
const C = (x, y, w, d, h, c, z = 0, more = {}) => ({ x, y, z, w, d, h, c, shape: "cyl", ...more });
const depthOf = bs => { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const b of bs) { x0 = Math.min(x0, b.x); x1 = Math.max(x1, b.x + b.w); y0 = Math.min(y0, b.y); y1 = Math.max(y1, b.y + b.d); } return (x0 + x1 + y0 + y1) / 2; };
const legs = (x0, y0, x1, y1, h, c = "#1a140f") => [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([x, y]) => B(x, y, 0.05, 0.05, h, c));
function cabinetDoors(Y, x0, x1, h) { // two doors with knobs on a +y face
  faceY(Y, x0, x1, 0, h, (w, hh) => {
    g.strokeStyle = "rgba(0,0,0,.45)"; g.lineWidth = 1.5; g.strokeRect(6, 10, w / 2 - 9, hh - 18); g.strokeRect(w / 2 + 3, 10, w / 2 - 9, hh - 18);
    g.fillStyle = "#b8a77a"; g.beginPath(); g.arc(w / 2 - 8, hh / 2, 2.5, 0, 7); g.arc(w / 2 + 8, hh / 2, 2.5, 0, 7); g.fill();
  });
}
function bbox(bs) {
  let r = [1e9, 1e9, -1e9, -1e9];
  for (const b of bs) for (const x of [b.x, b.x + b.w]) for (const y of [b.y, b.y + b.d]) for (const z of [b.z || 0, (b.z || 0) + b.h]) {
    const [sx, sy] = P(x, y, z); r = [Math.min(r[0], sx), Math.min(r[1], sy), Math.max(r[2], sx), Math.max(r[3], sy)];
  }
  return r;
}
// Draw in local coords (100 units = 1 tile) on a vertical plane facing the viewer.
function faceX(X, y0, y1, z0, z1, fn) {
  const [ox, oy] = P(X, y1, z1);
  g.save(); g.transform(T / 100, -T / 200, 0, T / 100, ox, oy); fn((y1 - y0) * 100, (z1 - z0) * 100); g.restore();
}
function faceY(Y, x0, x1, z0, z1, fn) {
  const [ox, oy] = P(x0, Y, z1);
  g.save(); g.transform(T / 100, T / 200, 0, T / 100, ox, oy); fn((x1 - x0) * 100, (z1 - z0) * 100); g.restore();
}
const B = (x, y, w, d, h, c, z = 0) => ({ x, y, z, w, d, h, c });
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp100 = v => Math.min(100, Math.max(0, v));
const tier = k => S.furn[k];

let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const SKY = Array.from({ length: 10 }, (_, i) => ({ x: i * 18 + rnd() * 6, w: 12 + rnd() * 10, h: 40 + rnd() * 85,
  lit: Array.from({ length: 12 }, () => [rnd(), rnd(), rnd()]) }));
const RAIN = Array.from({ length: 40 }, () => [rnd(), rnd()]);

// ---------- layout ----------
const ROOMS = [
  { name: "Sala", x0: 0, y0: 0, x1: 7, y1: 6, floor: "wood" },
  { name: "Cozinha", x0: 7, y0: 0, x1: 12, y1: 4, floor: "checker" },
  { name: "Escritório", x0: 7, y0: 4, x1: 12, y1: 10, floor: "dark" },
  { name: "Quarto", x0: 0, y0: 6, x1: 4, y1: 10, floor: "carpet" },
  { name: "Banheiro", x0: 4, y0: 6, x1: 7, y1: 10, floor: "tile" },
];
// Solid stretches of inner wall: [axis, at, from, to]; gaps between them are doorways.
const WALLS = [
  ["x", 7, 0, 1], ["x", 7, 3, 4], ["x", 7, 5, 10], ["x", 4, 6, 10],
  ["y", 4, 7, 9], ["y", 4, 10, 12], ["y", 6, 0, 2], ["y", 6, 3, 5], ["y", 6, 6, 7],
];
const WALL_PIECES = [];
for (const [ax, at, a, b] of WALLS) for (let s = a; s < b; s++) {
  const e = Math.min(b, s + 1);
  WALL_PIECES.push(ax === "x" ? B(at - 0.06, s, 0.12, e - s, IH, "#4b4b54") : B(s, at - 0.06, e - s, 0.12, IH, "#4b4b54"));
}

// ---------- furniture ----------
const TVB = (t = tier("tv")) => [
  [B(0.05, 2, 0.75, 1.3, 0.5, "#3a2c22"), B(0.1, 2.1, 0.65, 1.05, 0.75, "#4a3a2e", 0.5)],
  [B(0.05, 1.95, 0.8, 1.4, 0.5, "#2a2a2e"), B(0.12, 2.05, 0.62, 0.9, 0.12, "#1b1b1f", 0.5), B(0.08, 2.05, 0.7, 1.15, 0.85, "#161618", 0.62)],
  [B(0.05, 1.85, 0.85, 1.6, 1.5, "#9ea3ab")],
][t];
// BD-1 itself (case, monitor, keyboard, modem), standing on whatever surface is at height z
const pcBoxes = (t, z) => {
  const skin = t === 2 ? "#26282e" : "#cdc6b4", b = [
    B(4.15, 0.12, 1.1, 0.6, 0.16, skin, z), B(4.3, 0.15, 0.8, 0.5, 0.55, skin, z + 0.16), B(4.25, 0.75, 0.9, 0.15, 0.04, "#9a958a", z)];
  if (t >= 1) b.push(B(5.3, 0.58, 0.4, 0.22, 0.07, "#111113", z)); // modem
  return b;
};
const DESKB = (t = tier("pc")) => [B(4.0, 0.05, 1.8, 0.9, 0.75, "#2a211b"), ...pcBoxes(t, 0.75),
  B(5.4, 0.25, 0.12, 0.12, 0.35, "#1b1b1f", 0.75), B(5.3, 0.18, 0.32, 0.26, 0.1, "#2f5a43", 1.1)]; // + banker's lamp
const CRATESB = (t = tier("pc")) => [B(4.1, 0.1, 0.6, 0.7, 0.5, "#6b5a3a"), B(5.1, 0.1, 0.6, 0.7, 0.5, "#6b5a3a"),
  B(4.0, 0.05, 1.8, 0.9, 0.06, "#7a6440", 0.5), ...pcBoxes(t, 0.56)]; // a plank over two fruit crates
const pcScreen = z => faceY(0.65, 4.37, 5.03, z + 0.23, z + 0.64, (w, h) => {
  g.fillStyle = "#050806"; g.fillRect(0, 0, w, h); if (powerCut()) return;
  g.fillStyle = tier("pc") === 2 ? "#ffb000" : "#39d98a"; g.font = "9px monospace";
  g.fillText("BLACK DOG", 5, 12); g.fillText("> " + fmt(S.cycles), 5, 24);
  if (Date.now() % 1000 < 500) g.fillRect(5, 30, 5, 7);
});
const FRIDGEB = (t = tier("geladeira")) => [B(10.4, 0.05, 0.8, 0.8, t === 2 ? 2.1 : 1.9, ["#cfcac0", "#a9b8b2", "#c3c9d1"][t])];
const BEDB = (t = tier("cama")) => {
  const wide = t >= 1 ? 1.6 : 1.2, y = 8.2;
  return [B(0.02, y, 0.12, wide, 0.95, "#2a211b"), B(0.02, y, 2.2, wide, 0.35, "#2a211b"),
    B(0.1, y + 0.05, 2.05, wide - 0.1, 0.18, t === 2 ? "#3f6f86" : "#d8d4cc", 0.35),
    B(0.15, y + 0.15, 0.45, wide - 0.3, 0.1, "#ece8e0", 0.53),
    B(0.7, y + 0.05, 1.45, wide - 0.1, 0.06, ["#3a3f4f", "#5a1f24", "#2f4f5f"][t], 0.53),
    B(0.7, y + 0.05, 0.16, wide - 0.1, 0.075, ["#565d72", "#7a2e35", "#46707f"][t], 0.53), // folded-back sheet
    B(0.02, y, 0.16, 0.12, 1.15, "#1f1813"), B(0.02, y + wide - 0.12, 0.16, 0.12, 1.15, "#1f1813")]; // bed posts
};
// BD-1 grows its first server rack at Hardware 10
const RACKS = () => Array.from({ length: Math.min(5, Math.floor(S.levels.hardware / 10)) }, (_, i) => B(11.1, 4.35 + i * 1.05, 0.8, 0.85, 2.0, "#18181c"));
const CABINETS = () => Array.from({ length: Math.min(4, 1 + Math.floor(S.levels.dados / 5)) }, (_, i) => B(7.15, 5.6 + i * 0.62, 0.55, 0.58, 1.3, "#4a4a52"));

// lore and easter eggs: found ones are counted as "pistas"
const CORK = ["A nota fiscal do BD-1 diz 'Black Dog Systems, 1999'. Estamos em 1986.", "Toda manchete que o BD-1 imprime... acontece. Depois.",
  "Lena sabia de alguma coisa. Por isso sumiu.", "Quem paga essa luz? Os números não fecham.", "O cachorro preto aparece quando o mercado vira."];
function found(egg, text) {
  if (!S.eggs[egg]) { S.eggs[egg] = 1; S.cycles += 1 + totalRate() * 600; toast("Pista encontrada"); save(); }
  say(text, 6000);
}

// Objects: boxes() for drawing/collision, spot = where Dex stands to use it, seat = where he ends up, act = what happens.
const O = [];
const obj = o => (O.push(o), o);
const sit = (x, y, z, front = false) => ({ x, y, z, front });

obj({ id: "shelf", boxes: () => [B(0.02, 0.3, 0.45, 1.25, 1.9, "#2f241c")], spot: [1.0, 0.9],
  extra: () => faceX(0.47, 0.3, 1.55, 0, 1.9, (w, h) => {
    const cols = ["#5a1f24", "#2f3a4a", "#6b6250", "#3a4a3f", "#8a8478", "#2a2a2e"];
    for (let s = 0; s < 4; s++) {
      g.fillStyle = "#1f1813"; g.fillRect(4, s * 46 + 40, w - 8, 6);
      for (let b = 0, x = 10; x < w - 20; b++) {
        const bw = 7 + ((b * 7 + s * 3) % 6), out = s === 2 && b === 4;
        g.fillStyle = cols[(b + s) % 6]; g.fillRect(x + (out ? -3 : 0), s * 46 + 10 + (b % 3) * 2 - (out ? 4 : 0), bw, 30 - (b % 3) * 2); x += bw + 2;
      }
    }
    g.fillStyle = "#cfc6b0"; g.font = "5px serif"; g.fillText("MOBY DICK", 52, 112);
  }),
  act: () => found("livro", "Um livro fora do lugar. Moby Dick... com um envelope dentro: 'BD-0'.") });
obj({ id: "tv", key: "tv", boxes: () => TVB(), spot: [2.4, 2.6], seat: sit(3.25, 2.6, 0.45),
  extra: bs => {
    const b = bs[bs.length - 1];
    faceX(b.x + b.w, b.y, b.y + b.d, b.z || 0, (b.z || 0) + b.h, (w, h) => {
      const sh = Math.min(h - 16, w * 0.6);
      g.fillStyle = tv ? `hsl(210,10%,${50 + Math.random() * 25}%)` : "#141618";
      g.beginPath(); g.roundRect(8, 8, w * 0.72, sh, 10); g.fill();
      g.fillStyle = "#b8a77a"; for (const ky of [0.25, 0.5]) { g.beginPath(); g.arc(w * 0.87, sh * ky + 10, 6, 0, 7); g.fill(); }
    });
    if (tier("tv") === 0) { line(P(0.42, 2.62, 1.25), P(0.42, 2.15, 1.95), "#77777f", 1.2); line(P(0.42, 2.62, 1.25), P(0.42, 3.1, 1.85), "#77777f", 1.2); }
    if (tier("tv") < 2) { const s = bs[0]; faceX(s.x + s.w, s.y, s.y + s.d, 0, s.h, (w, h) => { g.strokeStyle = "rgba(0,0,0,.5)"; g.lineWidth = 1.5; g.strokeRect(8, 8, w / 2 - 12, h - 16); g.strokeRect(w / 2 + 4, 8, w / 2 - 12, h - 16); }); }
  },
  act: () => { const b = TVB().at(-1); zoomTo(P(b.x + b.w, b.y + b.d / 2, (b.z || 0) + b.h / 2), tvOn); } });
obj({ id: "coffee", boxes: () => [...legs(1.53, 2.23, 2.02, 2.92, 0.3), B(1.5, 2.2, 0.6, 0.8, 0.06, "#3a2c22", 0.3),
  B(1.6, 2.35, 0.32, 0.24, 0.02, "#d8d3c2", 0.36), C(1.85, 2.72, 0.1, 0.1, 0.1, "#d8d4cc", 0.36, { inner: "#3a2416" })] }); // magazine and a mug of coffee
const ARM = y => [B(2.9, y, 0.95, 0.22, 0.5, "#2e211d"), B(2.88, y - 0.01, 0.99, 0.24, 0.08, "#3e2c27", 0.5)];
obj({ id: "sofaA", boxes: () => ARM(1.6) });
obj({ id: "sofa", boxes: () => [B(2.9, 1.8, 0.8, 1.6, 0.28, "#2e211d"), B(2.95, 1.84, 0.64, 0.77, 0.16, "#4a3430", 0.28), B(2.95, 2.63, 0.64, 0.77, 0.16, "#4a3430", 0.28)],
  spot: [2.4, 2.6], seat: sit(3.25, 2.6, 0.45),
  act: () => { say("Cinco minutos de silêncio. Só isso que eu peço."); busy(6000, () => { S.needs.energia = clamp100(S.needs.energia + 5); }); } });
obj({ id: "sofaBack", boxes: () => [B(3.6, 1.8, 0.25, 1.6, 0.85, "#2e211d")],
  extra: () => faceX(3.85, 1.8, 3.4, 0.1, 0.85, (w, h) => { // chesterfield tufting
    g.fillStyle = "rgba(0,0,0,.45)"; for (let i = 0; i < 7; i++) for (let j = 0; j < 3; j++) { g.beginPath(); g.arc(12 + i * 22 + (j % 2) * 11, 14 + j * 20, 1.8, 0, 7); g.fill(); }
  }) });
obj({ id: "sofaB", boxes: () => ARM(3.4) });
obj({ id: "lamp", boxes: () => [C(0.33, 3.83, 0.34, 0.34, 0.05, "#1b1b1f"), C(0.47, 3.97, 0.06, 0.06, 1.4, "#8a8f96", 0.05), C(0.35, 3.85, 0.3, 0.3, 0.34, "#d8c89c", 1.38, { taper: 1.6 })],
  spot: [1.0, 4.0], act: () => { S.lampOff = !S.lampOff; say(S.lampOff ? "Escuro combina comigo." : "Melhor assim."); } });
// club armchair: wooden feet, tall tufted back, low rolled arms, a thick seat cushion
obj({ id: "armchair", boxes: () => [...legs(1.03, 5.08, 1.62, 5.68, 0.1),
    B(1.0, 5.05, 0.7, 0.7, 0.22, "#6b2228", 0.1), B(1.15, 5.17, 0.52, 0.46, 0.12, "#8a3036", 0.32),
    B(1.0, 5.05, 0.16, 0.7, 0.92, "#5a1c22", 0.1),
    B(1.12, 5.05, 0.58, 0.12, 0.42, "#5a1c22", 0.1), B(1.12, 5.63, 0.58, 0.12, 0.42, "#5a1c22", 0.1)],
  extra: () => faceX(1.16, 5.17, 5.63, 0.5, 1.02, (w, h) => { g.fillStyle = "rgba(0,0,0,.45)"; for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { g.beginPath(); g.arc(10 + i * 13 + j * 6, 12 + j * 16, 1.6, 0, 7); g.fill(); } }),
  spot: [2.1, 5.4], seat: sit(1.42, 5.4, 0.45, true),
  act: () => { say("Chandler. Sempre Chandler."); busy(8000, () => { S.needs.diversao = clamp100(S.needs.diversao + 10); }); } });
function listen(auto) {
  if (!auto) return zoomTo(owns("records") ? P(0.4, 4.95, 0.6) : P(0.3, 5.0, 0.2), openRadio); // close-up, then the radio's face

  say("Vamos ver o que toca hoje..."); busy(6000, () => { S.needs.diversao = clamp100(S.needs.diversao + 12); });
}
// starter radio: a pocket transistor on the floor, replaced by the vitrola once bought
obj({ id: "radio", hideIf: "records", boxes: () => [B(0.15, 4.75, 0.3, 0.55, 0.32, "#2a2a30")], spot: [0.8, 4.8],
  extra: () => {
    line(P(0.3, 4.8, 0.32), P(0.3, 5.25, 0.32), "#77777f", 2); line(P(0.3, 5.25, 0.32), P(0.3, 5.7, 1.0), "#9aa0a6", 1); // handle, antenna
    faceX(0.45, 4.75, 5.3, 0, 0.32, (w, h) => {
      g.fillStyle = "#77777f"; for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { g.beginPath(); g.arc(30 + i * 6, 9 + j * 7, 1.6, 0, 7); g.fill(); }
      g.fillStyle = S.radio ? "#e0a83a" : "#3a3020"; g.fillRect(6, 8, 16, 6);
    });
  },
  act: auto => listen(auto) });
// the radio lives in a 1950s radiogram console ("vitrola"): turntable on top, tube radio dial, speaker cloth in front
obj({ id: "records", boxes: () => [
    ...[[0.08, 4.38], [0.6, 4.38], [0.08, 5.48], [0.6, 5.48]].map(([x, y]) => B(x, y, 0.05, 0.05, 0.14, "#1a140f")),
    B(0.05, 4.35, 0.65, 1.2, 0.62, "#5a3a24", 0.14), B(0.1, 4.4, 0.55, 1.1, 0.03, "#3a2618", 0.76)],
  spot: [1.2, 4.7],
  extra: () => {
    poly([P(0.05, 4.35, 0.79), P(0.05, 5.55, 0.79), P(0.13, 5.55, 1.45), P(0.13, 4.35, 1.45)], "#4a2f1d", "rgba(0,0,0,.55)"); // open lid
    const [x, y] = P(0.38, 4.75, 0.8), a = S.radio ? Date.now() / 250 : 0;
    g.fillStyle = "#2a2a2e"; g.beginPath(); g.ellipse(x, y, T * 0.3, T * 0.15, 0, 0, 7); g.fill();
    g.fillStyle = "#050505"; g.beginPath(); g.ellipse(x, y, T * 0.26, T * 0.13, 0, 0, 7); g.fill();
    g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 0.5;
    for (const r of [0.2, 0.15, 0.11]) { g.beginPath(); g.ellipse(x, y, T * r, T * r / 2, 0, 0, 7); g.stroke(); }
    g.fillStyle = "#b3141b"; g.beginPath(); g.ellipse(x, y, T * 0.07, T * 0.035, 0, 0, 7); g.fill();
    line([x, y], [x + Math.cos(a) * T * 0.07, y + Math.sin(a) * T * 0.035], "#e8e2d2", 1);
    line(P(0.55, 5.1, 0.84), P(0.45, 4.86, 0.83), "#c9c2b0", Math.max(1, T * 0.03)); // tonearm
    poly([P(0.15, 5.15, 0.8), P(0.6, 5.15, 0.8), P(0.6, 5.45, 0.8), P(0.15, 5.45, 0.8)], S.radio ? "#e0a83a" : "#3a3020", "rgba(0,0,0,.5)"); // tuning dial
    faceX(0.7, 4.35, 5.55, 0.14, 0.76, (w, h) => {
      g.fillStyle = "#c9b48a"; g.fillRect(8, 8, w * 0.55, h - 16);
      g.strokeStyle = "rgba(60,40,20,.45)"; g.lineWidth = 1;
      for (let i = 12; i < w * 0.55 + 6; i += 5) { g.beginPath(); g.moveTo(i, 8); g.lineTo(i, h - 8); g.stroke(); }
      g.fillStyle = "#e0c88f"; for (const kx of [0.72, 0.88]) { g.beginPath(); g.arc(w * kx, h * 0.6, 6, 0, 7); g.fill(); }
      g.fillStyle = "#e8d9a8"; g.font = "bold 7px serif"; g.fillText("HI-FI", w * 0.72, h * 0.3);
    });
  },
  act: auto => listen(auto) });
obj({ id: "radiator", boxes: () => [B(1.5, 0.02, 1.2, 0.2, 0.55, "#5d5d63"), C(1.55, 0.05, 0.08, 0.08, 0.08, "#8a8f96", 0.55)], // + valve
  extra: () => faceY(0.22, 1.5, 2.7, 0.03, 0.55, (w, h) => { g.fillStyle = "rgba(0,0,0,.45)"; for (let x = 6; x < w - 4; x += 8) g.fillRect(x, 4, 3, h - 8); }) }); // cast-iron fins
function work() { say(pick(["Ao trabalho, BD-1.", "Vamos ver o que o mundo está dizendo hoje."])); busy(20000, () => {}, "work"); }
// starter workstation: BD-1 on a plank over two crates; Dex sits on the floor
obj({ id: "crates", key: "pc", hideIf: "desk", boxes: () => CRATESB(), spot: [4.95, 1.95], seat: sit(4.95, 1.25, 0.12),
  extra: () => {
    for (const x0 of [4.1, 5.1]) { // slatted fruit crates
      const slats = (w, h) => { g.fillStyle = "rgba(0,0,0,.5)"; g.fillRect(0, h * 0.32, w, 3); g.fillRect(0, h * 0.66, w, 3); g.fillStyle = "rgba(255,240,200,.25)"; g.font = "bold 8px serif"; g.fillText(tr("FRUTAS"), 6, h * 0.55); };
      faceY(0.8, x0, x0 + 0.6, 0, 0.5, slats); faceX(x0 + 0.6, 0.1, 0.8, 0, 0.5, slats);
    }
    pcScreen(0.56);
  }, act: work });
obj({ id: "desk", key: "pc", boxes: () => DESKB(), spot: [4.95, 1.95],
  seat: () => owns("deskchair") ? sit(4.95, 1.25, 0.45) : { x: 4.95, y: 1.25, z: 0, front: false, stand: true },
  extra: () => {
    pcScreen(0.75);
    faceY(0.31, 5.62, 5.82, 0.75, 0.95, (w, h) => { g.fillStyle = "#cfc6b0"; g.fillRect(0, 0, w, h); g.fillStyle = "#555"; g.fillRect(3, 3, w - 6, h - 6); }); // Lena's photo
    faceY(0.95, 4.0, 5.8, 0, 0.75, (w, h) => { // desk drawers
      g.strokeStyle = "rgba(0,0,0,.5)"; g.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) { g.strokeRect(w - 52, 8 + i * 22, 44, 18); g.fillStyle = "#b8a77a"; g.fillRect(w - 34, 15 + i * 22, 8, 3); }
      g.strokeRect(8, 8, 60, 16);
    });
  },
  act: work });
obj({ id: "chair", boxes: () => [...legs(4.72, 1.07, 5.13, 1.38, 0.4, "#141417"), B(4.7, 1.05, 0.5, 0.4, 0.06, "#2a2a30", 0.4)] });
obj({ id: "chairBack", boxes: () => [B(4.72, 1.42, 0.05, 0.06, 0.9, "#141417"), B(5.13, 1.42, 0.05, 0.06, 0.9, "#141417"), B(4.7, 1.42, 0.5, 0.07, 0.28, "#2a2a30", 0.62)] });
obj({ id: "photo", area: () => bbox([B(5.62, 0.31, 0.2, 0, 0.2, "", 0.75)]), minZoom: 3, walk: false,
  act: () => found("foto", "Lena. Verão de '84. Ela disse que voltava.") });
obj({ id: "cork", area: () => bbox([B(5.9, 0, 1.0, 0, 1.0, "", 1.1)]), spot: [6.4, 0.9],
  act: () => { found("cork", CORK[0]); S.corkI = ((S.corkI || 0) + 1) % CORK.length; say(CORK[S.corkI], 6000); } });
obj({ id: "clock", area: () => bbox([B(0, 3.4, 0, 0.5, 0.5, "", 1.9)]), walk: false,
  act: () => found("clock", tr("São {h} em Nova York. Em algum lugar, alguém também está acordado.", { h: nyc().toTimeString().slice(0, 5) })) });
obj({ id: "window", area: () => bbox([B(1.2, 0, 1.8, 0, 1.4, "", 1)]), spot: [2.1, 0.9],
  act: () => {
    if (dogVisible()) { dogUntil = 0; S.cycles += totalRate() * 1800 + 3; found("dog", "O cachorro preto. Na escada de incêndio. Ninguém mais vê ele."); return; }
    zoomTo(P(2.1, 0, 1.7), () => { S.needs.diversao = clamp100(S.needs.diversao + 15); openCity(); });
  } });
// kitchen
obj({ id: "sink", boxes: () => [B(7.15, 0.05, 0.8, 0.7, 0.9, "#bdb8ae"), B(7.35, 0.15, 0.4, 0.4, 0.02, "#7d838b", 0.9), B(7.52, 0.08, 0.06, 0.06, 0.25, "#9aa0a6", 0.9)],
  extra: () => cabinetDoors(0.75, 7.15, 7.95, 0.9), spot: [7.55, 1.3],
  act: () => { say("Água fria. Acorda qualquer um."); busy(2500, () => { S.needs.higiene = clamp100(S.needs.higiene + 15); }); } });
obj({ id: "stove", boxes: () => [B(7.95, 0.05, 0.8, 0.7, 0.9, "#1e1e22")], spot: [8.35, 1.3],
  extra: () => {
    for (const [x, y] of [[8.15, 0.25], [8.55, 0.25], [8.15, 0.55], [8.55, 0.55]]) { const [sx, sy] = P(x, y, 0.91); g.strokeStyle = "#77777f"; g.lineWidth = 1; g.beginPath(); g.ellipse(sx, sy, T * 0.12, T * 0.06, 0, 0, 7); g.stroke(); }
    faceY(0.75, 7.95, 8.75, 0, 0.9, (w, h) => { // oven door with window, handle and knobs
      g.fillStyle = "#cfcac0"; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(12 + i * 18, 9, 3, 0, 7); g.fill(); }
      g.fillStyle = "#0a0a0c"; g.fillRect(12, 32, w - 24, h - 50); g.fillStyle = "#9aa0a6"; g.fillRect(14, 22, w - 28, 3);
    });
  },
  act: () => say("Não cozinho desde 1983. Longa história.") });
obj({ id: "fridge", key: "geladeira", boxes: () => FRIDGEB(), spot: [10.8, 1.3],
  extra: bs => faceY(0.85, 10.4, 11.2, 0, bs[0].h, (w, h) => {
    g.fillStyle = "rgba(0,0,0,.2)"; g.fillRect(4, h * 0.33, w - 8, 3);
    g.fillStyle = "#77777f"; g.fillRect(w - 16, h * 0.12, 4, h * 0.15); g.fillRect(w - 16, h * 0.4, 4, h * 0.3);
    g.fillStyle = "#efe9d8"; g.fillRect(14, 70, 22, 28); g.fillStyle = "#b3141b"; g.fillRect(22, 68, 6, 4); // a note under a red magnet
    g.fillStyle = "#333"; g.font = "4px serif"; g.fillText("pague", 16, 82); g.fillText("a luz", 16, 88);
  }),
  act: () => {
    say(pick(["Pizza fria de ontem. Perfeita.", "Comida chinesa de caixinha. Clássico.", "Café requentado e um bagel."]));
    busy(3000, () => { S.needs.fome = clamp100(S.needs.fome + MEAL[tier("geladeira")]); });
  } });
obj({ id: "counter", boxes: () => [B(11.2, 0.05, 0.75, 0.7, 0.9, "#bdb8ae"), B(11.3, 0.15, 0.3, 0.3, 0.4, "#111113", 0.9), C(11.36, 0.5, 0.16, 0.16, 0.14, "#d8d4cc", 0.9, { inner: "#3a2416" })],
  spot: [11.5, 1.3], extra: () => { steam(P(11.45, 0.3, 1.3)); cabinetDoors(0.75, 11.2, 11.95, 0.9); },
  act: () => { say("Café preto. Sem açúcar, sem perguntas."); busy(2000, () => { S.needs.energia = clamp100(S.needs.energia + 8); }); } });
obj({ id: "phone", area: () => bbox([B(10.05, 0, 0.27, 0, 0.45, "", 1.1)]), spot: [10.2, 0.9],
  act: () => ringing ? answerCall() : say(pick(["Tom de discagem. Ninguém liga mais.", "Alô? ...Só estática.", "Disquei o número da Lena. Fora de serviço."])) });
obj({ id: "door", area: () => bbox([B(9, 0, 1, 0, 2.1, "", 0)]), spot: [9.5, 1.3],
  act: () => { S.doorLocked = !S.doorLocked; save(); say(S.doorLocked ? "Trancada. Nessa cidade, sempre." : "Destrancada. Espero não me arrepender."); } });
obj({ id: "calendar", area: () => bbox([B(11.3, 0, 0.6, 0, 0.7, "", 1.3)]), spot: [11.5, 1.3],
  act: () => found("calendar", "Os dias riscados de vermelho. Eu não risquei nenhum.") });
obj({ id: "mail", area: () => S.bills.length ? bbox([B(9.15, 0.25, 0.75, 0.7, 0.05, "")]) : null, spot: [9.5, 1.3],
  act: () => openBills() });
obj({ id: "table", boxes: () => [C(9.22, 2.17, 0.46, 0.46, 0.04, "#1f1813"), C(9.38, 2.33, 0.14, 0.14, 0.66, "#2a211b", 0.04, { taper: 1.4 }), C(9.05, 2.0, 0.8, 0.8, 0.06, "#3a2c22", 0.7)], // round bistro table spot: [10.9, 2.4], seat: sit(10.28, 2.4, 0.45),
  extra: () => { poly([P(9.15, 2.15, 0.77), P(9.55, 2.15, 0.77), P(9.55, 2.55, 0.77), P(9.15, 2.55, 0.77)], "#d9d3c2");
    for (let i = 0; i < 3; i++) line(P(9.2, 2.22 + i * 0.1, 0.77), P(9.5, 2.22 + i * 0.1, 0.77), "rgba(0,0,0,.45)");
    lampShade(P(9.45, 2.4, 2.3)); },
  act: auto => { if (!auto) openPaper(); busy(5000, () => { S.needs.diversao = clamp100(S.needs.diversao + 12); }); } });
obj({ id: "kchair", boxes: () => [...legs(10.07, 2.17, 10.43, 2.58, 0.4, "#222226"), B(10.05, 2.15, 0.45, 0.5, 0.06, "#3a3a40", 0.4)] });
obj({ id: "kchairBack", boxes: () => [B(10.45, 2.17, 0.06, 0.05, 0.95, "#222226"), B(10.45, 2.58, 0.06, 0.05, 0.95, "#222226"), B(10.45, 2.15, 0.07, 0.5, 0.25, "#3a3a40", 0.68)] });
obj({ id: "catbowl", boxes: () => [C(11.5, 3.4, 0.25, 0.25, 0.07, "#7a1218", 0, { taper: 0.8, inner: S.cat.bowl > 0 ? "#7a4a20" : "#2a0a0c" })], block: false, spot: [11.1, 3.2],
  act: () => {
    if (S.cat.bowl > 0) return say("A tigela ainda tem ração. Ele é que é exigente.");
    if (S.usd < CAT_FOOD) return say("Sem dinheiro nem pra ração. Desculpa, Sombra.");
    busy(1500, () => { S.usd -= CAT_FOOD; S.cat.bowl = 100; save(); say(pick(["Ração servida. Peixe de lata, o melhor da casa.", "Sombra! Comida!"])); });
  } });
obj({ id: "bin", boxes: () => [C(7.2, 3.35, 0.35, 0.35, 0.48, "#5a5a62", 0, { taper: 0.85 }), C(7.18, 3.33, 0.39, 0.39, 0.04, "#6a6a72", 0.48), C(7.34, 3.49, 0.07, 0.07, 0.04, "#8a8f96", 0.52)], spot: [7.85, 3.5],
  act: () => { if (!S.trash.length) return say("Limpo. Por um milagre."); dex.cleaning = true; say("Tá bom, tá bom. Faxina."); } });
// office
obj({ id: "racks", boxes: RACKS, spot: [10.4, 5.0],
  extra: bs => { if (powerCut()) return; for (const b of bs) faceY(b.y + b.d, b.x, b.x + b.w, 0, b.h, (w, h) => {
    for (let r = 0; r < 8; r++) for (let c = 0; c < 4; c++) { g.fillStyle = Math.random() < 0.3 ? "#39d98a" : Math.random() < 0.1 ? "#b3141b" : "#123020"; g.fillRect(10 + c * 12, 14 + r * 22, 5, 3); }
  }); },
  act: () => say(tr("BD-1 tem {n} rack(s). Ele cresce quando eu durmo.", { n: RACKS().length })) });
obj({ id: "cabinets", boxes: CABINETS, spot: [8.2, 6.5],
  extra: bs => { for (const b of bs) faceX(b.x + b.w, b.y, b.y + b.d, 0, b.h, (w, h) => { g.fillStyle = "#2a2a30"; for (let i = 0; i < 3; i++) g.fillRect(6, 10 + i * 42, w - 12, 3); }); },
  act: () => say("Arquivos. Nomes, datas, números. Quem guarda tudo isso, guarda por um motivo.") });
// stock ticker: brass-capped machine under a glass dome on a pedestal, paper tape spilling into a basket
obj({ id: "ticker", boxes: () => [B(8.0, 4.3, 0.4, 0.4, 0.05, "#1f1813"), B(8.14, 4.44, 0.12, 0.12, 0.75, "#3a2c22", 0.05),
    B(8.03, 4.33, 0.34, 0.34, 0.12, "#2a2a2e", 0.8), B(8.08, 4.38, 0.24, 0.24, 0.05, "#b8a77a", 0.92), B(8.55, 4.85, 0.35, 0.35, 0.28, "#7a6a4a")],
  spot: [8.2, 5.7],
  extra: () => {
    const [dx, dy] = P(8.2, 4.5, 0.97);
    g.fillStyle = "rgba(190,210,225,.22)"; g.strokeStyle = "rgba(230,240,250,.6)"; g.lineWidth = 1;
    g.beginPath(); g.ellipse(dx, dy, T * 0.2, T * 0.34, 0, Math.PI, 0); g.fill(); g.stroke(); // glass dome
    const pts = [P(8.37, 4.5, 0.86), P(8.5, 4.62, 0.7), P(8.45, 4.75, 0.55), P(8.62, 4.85, 0.45), P(8.7, 5.0, 0.3)];
    g.strokeStyle = "#111"; g.lineWidth = T * 0.07; g.lineJoin = "round"; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.stroke();
    g.strokeStyle = "#e8e2d2"; g.lineWidth = T * 0.045; g.stroke(); // the tape
    g.fillStyle = "#e8e2d2"; for (const [x, y] of [[8.65, 4.95], [8.78, 5.05], [8.7, 5.1]]) { const [sx, sy] = P(x, y, 0.29); g.beginPath(); g.arc(sx, sy, T * 0.05, 0, 7); g.fill(); }
  },
  act: () => { say("A fita não para. BDC sobe, BDC desce."); openExch(); } });
obj({ id: "floppies", boxes: () => [B(8.6, 7.0, 1.0, 0.6, 0.7, "#2a211b"), ...Array.from({ length: Math.min(6, 1 + Math.floor(S.levels.software / 5)) }, (_, i) => B(8.7 + (i % 3) * 0.28, 7.1 + Math.floor(i / 3) * 0.25, 0.2, 0.2, 0.08 + (i % 2) * 0.06, "#2c2c34", 0.7))],
  spot: [9.1, 7.95], act: () => say("Disquetes. Um deles diz 'BD-0 — NÃO APAGAR'.") });
obj({ id: "safe", boxes: () => [B(9.8, 9.1, 0.7, 0.7, 0.8, "#2a2e33")], spot: [10.15, 8.6],
  extra: () => faceY(9.8, 9.8, 10.5, 0, 0.8, (w, h) => { g.fillStyle = "#b8a77a"; g.beginPath(); g.arc(w / 2, h / 2, 12, 0, 7); g.fill(); g.fillStyle = "#111"; g.fillRect(w / 2 - 1, h / 2 - 12, 2, 8); }),
  act: () => found("safe", "Combinação: 1-9-8-6. Lá dentro, uma fita cassete marcada 'BD-0' e uma passagem só de ida.") });
// bedroom
obj({ id: "bed", key: "cama", boxes: () => BEDB(), spot: [2.6, 9.0], seat: () => { const b = BEDB(); return sit(1.2, b[1].y + b[1].d / 2, 0.55); },
  extra: bs => {
    const y1 = bs[1].y + bs[1].d; poly([P(1.4, y1 + 0.02), P(1.72, y1 + 0.02), P(1.72, y1 + 0.18), P(1.4, y1 + 0.18)], "#e8e2d2"); // note under the bed
    if (dex.sleeping) sleeper(P(0.38, bs[3].y + bs[3].d / 2, 0.72));
  },
  act: () => { dex.sleeping = true; say("Só cinco minutinhos...", 2500); if (tier("cama") === 2) bounce("cama"); } });
function sleeper([hx, hy]) { // Dex's head on the pillow + floating Zzz
  const u = T / 10;
  g.fillStyle = "#c9b2a0"; g.beginPath(); g.arc(hx, hy, 1.8 * u, 0, 7); g.fill();
  g.fillStyle = "#1d1410"; g.beginPath(); g.arc(hx - 0.6 * u, hy - 0.4 * u, 1.8 * u, Math.PI * 0.8, Math.PI * 1.9); g.fill();
  const k = (Date.now() / 1000) % 2; g.globalAlpha = 1 - k / 2; g.fillStyle = "#d8d4cc"; g.font = `700 ${T * 0.4}px serif`;
  g.fillText("z Z", hx + T * 0.2 + k * T * 0.3, hy - T * 0.4 - k * T * 0.5); g.globalAlpha = 1;
}
// starter bed: an old mattress on the floor
obj({ id: "mattress", hideIf: "bed", boxes: () => [B(0.15, 8.4, 1.9, 1.0, 0.16, "#a9a292"), B(0.2, 8.52, 0.4, 0.76, 0.07, "#c4bdac", 0.16), B(0.75, 8.42, 1.1, 0.95, 0.05, "#4f4f47", 0.16)],
  spot: [2.6, 9.0], seat: sit(1.1, 8.9, 0.2),
  extra: () => {
    g.fillStyle = "rgba(0,0,0,.35)"; // quilting buttons
    for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) { const [x, y] = P(0.3 + i * 0.36, 8.55 + j * 0.35, 0.161); g.beginPath(); g.arc(x, y, Math.max(0.8, T * 0.025), 0, 7); g.fill(); }
    poly([P(1.5, 9.0, 0.22), P(1.75, 9.0, 0.22), P(1.75, 9.25, 0.22), P(1.5, 9.25, 0.22)], "rgba(60,50,30,.5)"); // old stain
    if (dex.sleeping) sleeper(P(0.4, 8.9, 0.32));
  },
  act: () => { dex.sleeping = true; say("Esse colchão já viu dias melhores.", 2500); } });
obj({ id: "note", area: () => { const b = BEDB()[1], y1 = b.y + b.d; return bbox([B(1.4, y1, 0.32, 0.18, 0.02, "")]); }, minZoom: 3.5, walk: false,
  act: () => found("note", "Um bilhete debaixo da cama: 'NÃO CONFIE NO BD-1. — L.'") });
obj({ id: "nightstand", boxes: () => [B(0.05, 7.55, 0.5, 0.5, 0.55, "#2a211b"), B(0.15, 7.65, 0.3, 0.2, 0.15, "#111113", 0.55)],
  extra: () => {
    faceY(7.85, 0.15, 0.45, 0.55, 0.7, (w, h) => { g.fillStyle = "#e0262e"; g.font = "bold 9px monospace"; g.fillText(nyc().toTimeString().slice(0, 5), 2, 11); });
    faceY(8.05, 0.05, 0.55, 0, 0.55, (w, h) => { g.strokeStyle = "rgba(0,0,0,.5)"; g.lineWidth = 1.5; g.strokeRect(6, 8, w - 12, 18); g.fillStyle = "#b8a77a"; g.beginPath(); g.arc(w / 2, 17, 2.5, 0, 7); g.fill(); });
  },
  spot: [1.0, 7.4], act: () => say("O despertador marca a hora certa. Eu nunca acerto ele.") });
obj({ id: "wardrobe", boxes: () => [B(3.0, 6.1, 0.9, 0.6, 2.0, "#2a211b")], spot: [3.45, 7.2],
  extra: () => faceY(6.7, 3.0, 3.9, 0, 2.0, (w, h) => { g.fillStyle = "#1a1410"; g.fillRect(w / 2 - 1, 8, 2, h - 16); g.fillStyle = "#b8a77a"; g.fillRect(w / 2 - 6, h / 2, 3, 8); g.fillRect(w / 2 + 3, h / 2, 3, 8); }),
  act: () => found("wardrobe", "Um sobretudo que não é meu. No bolso, um crachá: 'D. Moreno — Black Dog Systems'.") });
obj({ id: "bedwin", area: () => bbox([B(0, 6.4, 0, 1.0, 1.0, "", 1.2)]), spot: [1.0, 6.9],
  act: () => zoomTo(P(0, 6.9, 1.7), () => { S.needs.diversao = clamp100(S.needs.diversao + 10); openCity(); }) });
// bathroom
// clawfoot tub: brass ball feet, porcelain body, rolled rim, water, chrome tap at the head end
obj({ id: "tub", boxes: () => [...[[4.12, 8.03], [4.86, 8.03], [4.12, 9.71], [4.86, 9.71]].map(([x, y]) => C(x, y, 0.12, 0.12, 0.1, "#b8a77a")),
    B(4.1, 8.0, 0.9, 1.85, 0.42, "#cfcac0", 0.1), B(4.07, 7.97, 0.96, 1.91, 0.05, "#e8e4dc", 0.52), C(4.52, 7.98, 0.07, 0.07, 0.3, "#a8aeb4", 0.57)],
  spot: [5.45, 8.9], seat: sit(4.55, 8.9, 0.2, true),
  extra: () => {
    poly([P(4.16, 8.06, 0.575), P(4.96, 8.06, 0.575), P(4.96, 9.84, 0.575), P(4.16, 9.84, 0.575)], "#5f7a86", "rgba(0,0,0,.4)");
    line(P(4.3, 8.6, 0.576), P(4.7, 9.2, 0.576), "rgba(255,255,255,.18)", 1); // light on the water
    line(P(4.555, 8.0, 0.86), P(4.555, 8.22, 0.8), "#a8aeb4", Math.max(1.5, T * 0.04)); // spout
  },
  act: () => { say("Banho quente. A cidade pode esperar."); busy(6000, () => { S.needs.higiene = clamp100(S.needs.higiene + 60); }); } });
obj({ id: "duck", boxes: () => [C(4.45, 8.3, 0.14, 0.14, 0.08, "#d9b42a", 0.575), C(4.49, 8.29, 0.08, 0.08, 0.07, "#e0bd34", 0.65)], block: false, minZoom: 2.5, walk: false,
  act: () => found("duck", "Quack. ...Eu falei isso em voz alta?") });
// toilet: wall pipe, cistern with lid and chrome lever, round pedestal, bowl with water and a seat ring
obj({ id: "toilet", boxes: () => [C(6.53, 6.13, 0.06, 0.06, 0.42, "#9aa0a6"), B(6.33, 6.12, 0.5, 0.18, 0.42, "#d8d4cc", 0.42), B(6.31, 6.1, 0.54, 0.22, 0.05, "#e8e4dc", 0.84),
    B(6.84, 6.17, 0.05, 0.08, 0.03, "#a8aeb4", 0.74),
    C(6.44, 6.37, 0.24, 0.24, 0.22, "#cfcac0", 0, { taper: 1.3 }), C(6.35, 6.28, 0.42, 0.42, 0.2, "#e0dcd4", 0.22, { taper: 0.6, inner: "#8fa6b0" })],
  extra: () => {
    const [x, y] = P(6.56, 6.49, 0.42), R = 0.21 * T * Math.SQRT2, t = Date.now() / 1000;
    g.strokeStyle = "#f2efe8"; g.lineWidth = Math.max(1, T * 0.05); g.beginPath(); g.ellipse(x, y, R * 0.88, R * 0.43, 0, 0, 7); g.stroke(); // seat ring
    const [bx, by] = bowlBottom(6.56, 6.49, 0.42, 0.21);
    if (Date.now() < flushUntil) { // flush: water swirling down
      g.strokeStyle = "rgba(230,240,245,.8)"; g.lineWidth = 1;
      for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(bx, by, R * (0.45 - i * 0.12), R * (0.2 - i * 0.05), 0, t * 8 + i, t * 8 + i + 4); g.stroke(); }
    }
    if (!S.poo) return;
    // the comic bit: it floats, it bobs, it smells, it has fans
    const py = by + Math.sin(t * 2) * T * 0.012, u = T * 0.05;
    for (const [dx, dy, r, c] of [[0, 0, 1.6, "#4a2e14"], [0.2, -0.7, 1.15, "#5a3a1a"], [0.35, -1.25, 0.7, "#6a4622"]]) {
      g.fillStyle = c; g.beginPath(); g.ellipse(bx + dx * u, py + dy * u, r * u, r * u * 0.6, 0, 0, 7); g.fill();
    }
    g.fillStyle = "rgba(255,255,255,.35)"; g.beginPath(); g.arc(bx - 0.5 * u, py - 0.3 * u, 0.3 * u, 0, 7); g.fill();
    g.strokeStyle = "rgba(150,170,70,.55)"; g.lineWidth = Math.max(1, T * 0.03);
    for (let i = 0; i < 3; i++) { // stink lines
      const sx = x + (i - 1) * R * 0.5, k = (t * 0.6 + i * 0.33) % 1;
      g.globalAlpha = 1 - k; g.beginPath();
      for (let s = 0; s <= 8; s++) { const yy = y - k * T * 0.6 - s * T * 0.05, xx = sx + Math.sin(s * 1.2 + t * 3) * T * 0.04; s ? g.lineTo(xx, yy) : g.moveTo(xx, yy); }
      g.stroke(); g.globalAlpha = 1;
    }
    g.fillStyle = "#050505";
    for (let i = 0; i < 2; i++) { const a = t * (3 + i) + i * 2; g.beginPath(); g.arc(x + Math.cos(a) * R * 0.9, y - T * 0.35 + Math.sin(a * 1.7) * T * 0.15, Math.max(1, T * 0.025), 0, 7); g.fill(); } // flies
  },
  spot: [6.55, 7.3], seat: () => S.poo ? null : sit(6.56, 6.52, 0.42, true),
  act: auto => {
    if (S.poo) return flush("Adeus, velho amigo.");
    say(pick(["Privacidade, por favor.", "Ninguém precisa saber disso.", "O jornal de ontem tem utilidade, afinal.", "BD-1, não olha."]));
    busy(4000, () => {
      S.poo = true; save(); // he forgets the flush half the time; tap the toilet to flush
      if (Math.random() < 0.5) say(pick(["Esqueci a descarga. De novo.", "Depois eu dou descarga. Talvez."]));
      else setTimeout(() => flush("Descarga. Civilização."), 600);
    }, "toilet");
  } });
let flushUntil = 0;
function flush(line) { S.poo = false; flushUntil = Date.now() + 1500; say(line); save(); }
// pedestal sink: flared column, deep round basin, chrome tap with two cross knobs
obj({ id: "basin", boxes: () => [C(4.36, 6.27, 0.18, 0.18, 0.6, "#cfcac0", 0, { taper: 1.6 }), C(4.2, 6.11, 0.5, 0.5, 0.2, "#e0dcd4", 0.6, { taper: 0.55, inner: "#bdb8ae", drain: true }),
    C(4.42, 6.1, 0.06, 0.06, 0.16, "#a8aeb4", 0.8), C(4.3, 6.12, 0.06, 0.06, 0.05, "#c9ccd1", 0.8), C(4.54, 6.12, 0.06, 0.06, 0.05, "#c9ccd1", 0.8)],
  extra: () => line(P(4.45, 6.13, 0.95), P(4.45, 6.26, 0.9), "#a8aeb4", Math.max(1.5, T * 0.035)), spot: [4.45, 7.1],
  act: () => { say("Quem é esse cara no espelho?"); busy(2500, () => { S.needs.higiene = clamp100(S.needs.higiene + 15); }); } });
obj({ id: "shower", boxes: () => [B(6.15, 9.15, 0.8, 0.8, 0.08, "#cfcac0"), C(6.5, 9.5, 0.12, 0.12, 0.02, "#2a2a30", 0.08), C(6.86, 9.18, 0.06, 0.06, 1.7, "#a8aeb4"),
    C(6.5, 9.3, 0.2, 0.2, 0.03, "#b8bec4", 1.62, { inner: "#5a5f66" })],
  spot: [5.8, 9.5], seat: { x: 6.55, y: 9.55, z: 0.08, front: true, stand: true },
  extra: () => {
    const head = P(6.6, 9.4, 1.65); line(P(6.89, 9.21, 1.7), P(6.6, 9.4, 1.67), "#a8aeb4", 2);
    // curtain on its rod along the open side, with folds
    line(P(6.15, 9.15, 1.8), P(6.15, 9.95, 1.8), "#a8aeb4", 1.5);
    for (let i = 0; i < 6; i++) { const y0 = 9.15 + i * 0.13; poly([P(6.15, y0, 1.78), P(6.15, y0 + 0.13, 1.78), P(6.15, y0 + 0.13, 0.25), P(6.15, y0, 0.25)], i % 2 ? "rgba(150,165,175,.32)" : "rgba(180,195,205,.4)"); }
    if (dex.busy && dex.busy.kind === "shower") { g.strokeStyle = "rgba(200,215,230,.6)"; g.lineWidth = 1; for (let i = 0; i < 6; i++) { const x = head[0] + (i - 3) * T * 0.05, y = head[1] + ((Date.now() / 6 + i * 13) % (T * 1.5)); g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + T * 0.12); g.stroke(); } }
  },
  act: () => { say("Água morna, se tiver sorte."); busy(5000, () => { S.needs.higiene = clamp100(S.needs.higiene + 40); }, "shower"); } });

// which catalog item each object belongs to; objects without one are part of the bare apartment
const OWN = { shelf: "shelf", tv: "tv", coffee: "coffee", sofaA: "sofa", sofa: "sofa", sofaBack: "sofa", sofaB: "sofa", lamp: "lamp", armchair: "armchair",
  records: "records", desk: "desk", chair: "deskchair", chairBack: "deskchair", photo: "desk", cork: "cork", clock: "clock", counter: "counter",
  table: "ktable", kchair: "ktable", kchairBack: "ktable", ticker: "ticker", cabinets: "cabinets", floppies: "floppies", safe: "safe",
  bed: "bed", note: "bed", nightstand: "nightstand", wardrobe: "wardrobe", tub: "tub", duck: "tub" };
for (const o of O) if (OWN[o.id]) o.own = OWN[o.id];
const isLive = o => (!o.own || owns(o.own)) && !(o.hideIf && owns(o.hideIf));
const firstLive = (...ids) => ids.map(id => O.find(o => o.id === id)).find(o => o && isLive(o));

// trash spots (index = S.trash value)
const TRASH = [[1.8, 4.6], [3.5, 4.8], [5.2, 2.8], [6.2, 4.2], [2.0, 1.4], [8.2, 1.6], [10.8, 3.4], [7.8, 3.0], [9.4, 5.8], [10.2, 8.2], [8.4, 9.4], [1.2, 7.2], [3.3, 9.3], [5.8, 8.4]];
// one piece of trash (type depends on the spot index), at any height so it can also be drawn mid-fall
function drawTrashAt(i, x, y, z = 0) {
  const k = (i * 7) % 4;
  if (k === 0) box(B(x - 0.2, y - 0.2, 0.4, 0.4, 0.05, "#8a7a5a", z)); // pizza box
  else if (k === 1) { const [sx, sy] = P(x, y, z + 0.06); g.fillStyle = "#cfc6b0"; g.beginPath(); g.arc(sx, sy, T * 0.09, 0, 7); g.fill(); g.beginPath(); g.arc(sx + T * 0.15, sy + T * 0.05, T * 0.07, 0, 7); g.fill(); }
  else if (k === 2) box(C(x - 0.06, y - 0.06, 0.12, 0.12, 0.16, "#d8d4cc", z, { inner: "#3a2416" })); // cold coffee
  else { // banana peel, splayed: Dex slips on these
    const [sx, sy] = P(x, y, z + 0.02); g.strokeStyle = "#d9b42a"; g.lineWidth = T * 0.06; g.lineCap = "round";
    for (const a of [-2.2, -1.2, 0.3]) { g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(sx + Math.cos(a) * T * 0.15, sy + Math.sin(a) * T * 0.04, sx + Math.cos(a + 0.4) * T * 0.22, sy + Math.sin(a + 0.4) * T * 0.1); g.stroke(); }
    g.fillStyle = "#5a3a1a"; g.beginPath(); g.arc(sx, sy, T * 0.03, 0, 7); g.fill(); g.lineCap = "butt";
  }
}
function drawTrash() { S.trash.forEach(i => drawTrashAt(i, ...TRASH[i])); }

// ---------- pathfinding on a half-tile grid ----------
const CELL = 0.5, GW = W / CELL, GD = D / CELL;
function blockedGrid() {
  const bl = new Uint8Array(GW * GD);
  for (const o of O) if (o.boxes && o.block !== false && isLive(o)) {
    const bs = o.boxes(); if (!bs.length || Math.min(...bs.map(b => b.z || 0)) > 0.05) continue;
    // the whole footprint blocks, so legs don't leave walk-through gaps under tables and chairs
    const b = { x: Math.min(...bs.map(q => q.x)), y: Math.min(...bs.map(q => q.y)) };
    b.w = Math.max(...bs.map(q => q.x + q.w)) - b.x; b.d = Math.max(...bs.map(q => q.y + q.d)) - b.y;
    for (let j = 0; j < GD; j++) for (let i = 0; i < GW; i++) {
      const cx = (i + 0.5) * CELL, cy = (j + 0.5) * CELL;
      if (cx > b.x - 0.12 && cx < b.x + b.w + 0.12 && cy > b.y - 0.12 && cy < b.y + b.d + 0.12) bl[j * GW + i] = 1;
    }
  }
  return bl;
}
function crossesWall(ax, ay, bx, by) {
  for (const [axis, at, s0, s1] of WALLS) {
    const [p, q, r, s] = axis === "x" ? [ax, bx, ay, by] : [ay, by, ax, bx];
    if ((p - at) * (q - at) < 0) { const v = r + (at - p) / (q - p) * (s - r); if (v > s0 - 0.12 && v < s1 + 0.12) return true; }
  }
  return false;
}
function findPath(sx, sy, tx, ty) {
  const bl = blockedGrid(), idx = (i, j) => j * GW + i;
  const ok = (i, j) => i >= 0 && j >= 0 && i < GW && j < GD && !bl[idx(i, j)];
  const ci = v => Math.max(0, Math.min(GW - 1, Math.floor(v / CELL))), cj = v => Math.max(0, Math.min(GD - 1, Math.floor(v / CELL)));
  const start = idx(ci(sx), cj(sy));
  let gi = ci(tx), gj = cj(ty);
  if (!ok(gi, gj)) { // nearest free cell to the target
    let best = null;
    for (let r = 1; r < 5 && !best; r++) for (let j = gj - r; j <= gj + r; j++) for (let i = gi - r; i <= gi + r; i++)
      if (ok(i, j) && !crossesWall((i + 0.5) * CELL, (j + 0.5) * CELL, tx, ty) && (!best || Math.hypot(i - gi, j - gj) < Math.hypot(best[0] - gi, best[1] - gj))) best = [i, j];
    if (!best) return null; [gi, gj] = best;
  }
  const goal = idx(gi, gj), cost = new Float32Array(GW * GD).fill(Infinity), prev = new Int32Array(GW * GD).fill(-1), done = new Uint8Array(GW * GD);
  const h = n => Math.hypot(n % GW - gi, Math.floor(n / GW) - gj);
  cost[start] = 0; const open = [start];
  while (open.length) {
    let bi = 0; for (let k = 1; k < open.length; k++) if (cost[open[k]] + h(open[k]) < cost[open[bi]] + h(open[bi])) bi = k;
    const cur = open.splice(bi, 1)[0];
    if (cur === goal) break; if (done[cur]) continue; done[cur] = 1;
    const i = cur % GW, j = Math.floor(cur / GW);
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue;
      const ni = i + di, nj = j + dj;
      if (!ok(ni, nj) || (di && dj && (!ok(i + di, j) || !ok(i, j + dj)))) continue;
      if (crossesWall((i + 0.5) * CELL, (j + 0.5) * CELL, (ni + 0.5) * CELL, (nj + 0.5) * CELL)) continue;
      const n = idx(ni, nj), c = cost[cur] + (di && dj ? 1.414 : 1);
      if (c < cost[n]) { cost[n] = c; prev[n] = cur; open.push(n); }
    }
  }
  if (goal !== start && prev[goal] === -1) return null;
  const pts = [];
  for (let n = goal; n !== start && n !== -1; n = prev[n]) pts.unshift([(n % GW + 0.5) * CELL, (Math.floor(n / GW) + 0.5) * CELL]);
  // string-pulling: skip waypoints while the straight line stays clear
  const clear = (a, b) => {
    if (crossesWall(a[0], a[1], b[0], b[1])) return false;
    const steps = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.2);
    for (let s = 1; s < steps; s++) { const x = a[0] + (b[0] - a[0]) * s / steps, y = a[1] + (b[1] - a[1]) * s / steps; if (!ok(Math.floor(x / CELL), Math.floor(y / CELL))) return false; }
    return true;
  };
  const out = []; let from = [sx, sy];
  for (let k = 0; k < pts.length; k++) if (k === pts.length - 1 || !clear(from, pts[k + 1])) { out.push(pts[k]); from = pts[k]; }
  return out;
}

// ---------- Dex ----------
const dex = { x: 4.95, y: 1.25, z: 0.12, v: 0, path: [], then: null, seat: null, moving: false, sit: true, sleeping: false, busy: null,
  cleaning: false, front: false, walk: 0, idle: 0, chat: 5, say: "", sayUntil: 0, box: null, top: 0 };
const DEX_LINES = [
  "Bom garoto, BD-1. Continua processando.", "Essa cidade tem oito milhões de histórias. A minha é a mais estranha.",
  "Se a companhia telefônica me visse agora...", "O cachorro preto não dorme. Nem eu.", "Chove em Nova York como se devesse alguma coisa.",
  "Alguém está me seguindo. Ou eu estou seguindo alguém.", "Lena dizia que máquinas não sonham. O BD-1 fala dormindo.",
];
function say(text, ms = 4500) { dex.say = tr(text); dex.sayUntil = Date.now() + ms; }
function busy(ms, done, kind = "") { dex.busy = { until: Date.now() + ms, done, kind }; }
function walkTo(x, y, then, seat) {
  const p = findPath(dex.x, dex.y, x, y);
  if (!p) { say("Não tem como chegar aí."); return false; }
  Object.assign(dex, { sit: false, z: 0, sleeping: false, busy: null, path: p, then: then || null, seat: seat || null, idle: 0 });
  if (seat) p.push([seat.x, seat.y]);
  if (!p.length) arrive();
  return true;
}
function arrive() {
  const d = dex; d.moving = false; d.v = 0;
  if (d.seat) { Object.assign(d, { sit: !d.seat.stand, z: d.seat.z, front: d.seat.front }); d.seat = null; } else d.front = true;
  const f = d.then; d.then = null; f && f();
}
function use(o, auto = false) { // auto: Dex's own free will (no pop-up screens)
  if (!o) return false;
  if (o.walk === false || !o.spot) return o.act(auto);
  const seat = typeof o.seat === "function" ? o.seat() : o.seat;
  return walkTo(o.spot[0], o.spot[1], () => { if (!seat) dex.front = false; o.act(auto); }, seat);
}
const byId = id => O.find(o => o.id === id);

function updateDex(dt) {
  const d = dex, n = S.needs;
  if (d.path.length && Date.now() < (d.slipUntil || 0)) { d.moving = false; d.v = 0; } // flat on his back
  else if (d.path.length) {
    const [tx, ty] = d.path[0], dx = tx - d.x, dy = ty - d.y, dist = Math.hypot(dx, dy);
    let rem = dist; for (let i = 1; i < d.path.length; i++) rem += Math.hypot(d.path[i][0] - d.path[i - 1][0], d.path[i][1] - d.path[i - 1][1]);
    if (dist < 0.03) { d.x = tx; d.y = ty; d.path.shift(); if (!d.path.length) arrive(); }
    else {
      d.v = Math.min(d.v + 5 * dt, 1.8, Math.sqrt(2 * 5 * rem) + 0.1); // accelerate, cap, brake before the stop
      const s = Math.min(dist, d.v * dt); d.x += dx / dist * s; d.y += dy / dist * s;
      d.moving = true; d.front = dx + dy > 0; d.walk += dt * 4.5 * d.v;
      const peel = S.trash.find(i => (i * 7) % 4 === 3 && Math.hypot(TRASH[i][0] - d.x, TRASH[i][1] - d.y) < 0.3);
      if (peel !== undefined && Date.now() > (d.noSlip || 0)) { // slapstick: half the time he slips on the peel
        d.noSlip = Date.now() + 8000;
        if (Math.random() < 0.5) {
          d.slipUntil = Date.now() + 1800; say("AAAAI!", 1500);
          setTimeout(() => { S.trash = S.trash.filter(t => t !== peel); say(pick(["Quem deixou isso aqui? ...Ah. Fui eu.", "Ninguém viu. Ninguém viu nada.", "Minha dignidade ficou ali no chão."])); }, 1900);
        }
      }
    }
  } else if (d.sleeping) {
    n.energia = clamp100(n.energia + (owns("bed") ? SLEEP_RATE[tier("cama")] : 3) * dt);
    if (n.energia >= 100) { say("Bom dia, Nova York. Ou boa noite."); walkTo(2.6, 9.0); }
  } else if (d.busy) {
    if (d.busy.kind === "work" && !powerCut()) { S.cycles += 0.02 * dt; n.energia = clamp100(n.energia - 0.03 * dt); }
    if (Date.now() > d.busy.until) { const f = d.busy.done; d.busy = null; f(); }
  } else if (d.cleaning && S.trash.length) {
    const i = S.trash.reduce((a, b) => Math.hypot(TRASH[a][0] - d.x, TRASH[a][1] - d.y) < Math.hypot(TRASH[b][0] - d.x, TRASH[b][1] - d.y) ? a : b);
    pickUp(i);
  } else if (!tv && !camAnim && !overlayOpen()) {
    d.cleaning = false;
    d.idle += dt;
    // free will: Dex looks after himself when a need runs low
    if (d.idle > 3) {
      if (n.fome < 30) use(byId("fridge"), true);
      else if (n.energia < 25) use(firstLive("bed", "mattress"), true);
      else if (n.higiene < 30) use(firstLive("tub", "shower"), true);
      else if (S.trash.length >= 6) { d.cleaning = true; say("Esse lugar parece cena de crime."); }
      else if (S.cat.hunger < 20 && S.cat.bowl <= 0 && S.usd >= CAT_FOOD) use(byId("catbowl"), true); // Dex won't let Sombra starve
      else if (n.diversao < 40 && S.cat.aff > 30 && Date.now() - (S.cat.lastPet || 0) > 60000) petCat();
      else if (n.diversao < 30) use(pick(["armchair", "table", "records", "radio"].map(id => firstLive(id)).filter(Boolean)), true);
      else if (d.idle > 12) {
        const r = Math.random();
        if (r < 0.12 && !S.poo) use(byId("toilet"), true); // nature calls
        else if (r < 0.5 && !powerCut()) use(firstLive("desk", "crates"), true);
        else { const r = pick(ROOMS); walkTo(r.x0 + 0.8 + Math.random() * (r.x1 - r.x0 - 1.6), r.y0 + 0.8 + Math.random() * (r.y1 - r.y0 - 1.6)); }
      }
    }
  }
  d.chat -= dt;
  if (d.chat <= 0 && !tv && !d.sleeping) {
    d.chat = 16 + Math.random() * 12;
    const news = activeMods().filter(m => !m.sponsored);
    const wx = S.weather, r = Math.random(), item = pick(news);
    say(powerCut() ? "Cortaram a luz. De novo."
      : item && r < 0.35 ? tr("Ouvi no rádio: \"{h}\" ({s}).", { h: item.headline, s: item.source || tr("rádio") })
      : wx && r < 0.5 ? tr("Lá fora: {t}°C{w}. Típico.", { t: Math.round(LANG === "en" ? wx.temp * 9 / 5 + 32 : wx.temp), w: tr(wx.rain ? " e chuva" : wx.snow ? " e neve" : wx.fog ? " e neblina" : "") })
      : S.market && r < 0.6 ? tr("BDC a {p}. {dir} {pct}% na última hora.", { p: fmtUSD(S.price), dir: tr(S.market.change1h >= 0 ? "Subindo" : "Caindo"), pct: Math.abs(S.market.change1h).toFixed(1) })
      : r < 0.8 ? askBD1()
      : pick(DEX_LINES));
  }
}
function pickUp(i) {
  const [x, y] = TRASH[i];
  walkTo(x, y + 0.45, () => busy(1200, () => { S.trash = S.trash.filter(t => t !== i); }, "clean"));
}

function drawDex() {
  const d = dex, u = T / 10;
  if (d.sleeping) { d.box = null; return; }
  const [fx, fy] = P(d.x, d.y, 0), slip = Date.now() < (d.slipUntil || 0);
  g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.ellipse(fx, fy, T * 0.26, T * 0.13, 0, 0, 7); g.fill();
  if (slip) { // tip over backwards around the feet
    const k = Math.min(1, (1800 - (d.slipUntil - Date.now())) / 160);
    g.save(); g.translate(fx, fy); g.rotate(-Math.PI / 2 * k); g.translate(-fx, -fy);
  }
  const [x, y] = P(d.x, d.y, d.z), kind = d.busy && d.busy.kind;
  const bob = d.moving ? Math.abs(Math.sin(d.walk)) * u * 0.4 : kind === "dance" ? Math.abs(Math.sin(Date.now() / 150)) * u : Math.sin(Date.now() / 600) * u * 0.12;
  let base = y - bob + (kind === "clean" ? 2 * u : 0);
  if (!d.sit) {
    const sw = d.moving ? Math.sin(d.walk) * u * 0.8 : 0;
    g.fillStyle = "#2c2c33";
    g.fillRect(x - 1.6 * u, base - 4.5 * u, 1.3 * u, 4.5 * u - Math.max(0, sw));
    g.fillRect(x + 0.3 * u, base - 4.5 * u, 1.3 * u, 4.5 * u - Math.max(0, -sw));
    base -= 4.5 * u;
  }
  g.fillStyle = "#b3141b"; g.beginPath(); g.roundRect(x - 2.1 * u, base - 5 * u, 4.2 * u, 5.2 * u, u); g.fill(); // the one red thing in a grey city
  if (kind === "work") { g.fillStyle = "#c9b2a0"; g.fillRect(x - 2.4 * u, base - 2.5 * u + Math.sin(Date.now() / 60) * u * 0.3, 1 * u, 1 * u); }
  g.fillStyle = "#c9b2a0"; g.beginPath(); g.arc(x, base - 6.9 * u, 1.9 * u, 0, 7); g.fill();
  if (d.front) {
    g.strokeStyle = "#111"; g.lineWidth = Math.max(1, u * 0.3);
    g.strokeRect(x - 1.5 * u, base - 7.1 * u, 1.3 * u, 0.9 * u); g.strokeRect(x + 0.2 * u, base - 7.1 * u, 1.3 * u, 0.9 * u);
  } else { g.fillStyle = "#1d1410"; g.beginPath(); g.arc(x, base - 6.7 * u, 1.9 * u, 0, 7); g.fill(); }
  g.fillStyle = "#1b1b1f"; g.fillRect(x - 3 * u, base - 8.4 * u, 6 * u, 0.7 * u); // fedora brim
  g.beginPath(); g.roundRect(x - 1.9 * u, base - 10.2 * u, 3.8 * u, 2 * u, 0.6 * u); g.fill();
  g.fillStyle = "#3a3a42"; g.fillRect(x - 1.9 * u, base - 8.9 * u, 3.8 * u, 0.5 * u);
  d.top = base - 10.4 * u;
  d.box = [x - 2.4 * u, base - 10.4 * u, x + 2.4 * u, y];
  if (slip) { // cartoon stars around his head
    g.restore(); d.top = fy - T * 0.6;
    const t = Date.now() / 300; g.fillStyle = "#e0c060"; g.font = `${T * 0.22}px serif`; g.textAlign = "center";
    for (let i = 0; i < 3; i++) { const a = t + i * 2.1; g.fillText("★", fx - T * 0.95 + Math.cos(a) * T * 0.22, fy - T * 0.25 + Math.sin(a) * T * 0.08); }
    g.textAlign = "left";
  }
}

// ---------- walls, floors, windows ----------
const FLOOR = { wood: "#3b322b", dark: "#2a2420", carpet: "#2b2d36", tile: "#8f979c", checker: "#c9c9c9" };
function drawFloor(r) {
  poly([P(r.x0, r.y0), P(r.x1, r.y0), P(r.x1, r.y1), P(r.x0, r.y1)], FLOOR[r.floor]);
  if (r.floor === "checker") {
    for (let x = r.x0; x < r.x1; x += 0.5) for (let y = r.y0; y < r.y1; y += 0.5)
      if (((x + y) * 2) % 2 === 0) poly([P(x, y), P(x + 0.5, y), P(x + 0.5, y + 0.5), P(x, y + 0.5)], "#1e1e22");
  } else if (r.floor === "tile") {
    for (let x = r.x0; x <= r.x1; x += 0.25) line(P(x, r.y0), P(x, r.y1), "rgba(0,0,0,.18)");
    for (let y = r.y0; y <= r.y1; y += 0.25) line(P(r.x0, y), P(r.x1, y), "rgba(0,0,0,.18)");
  } else if (r.floor !== "carpet") {
    for (let x = r.x0 + 0.5; x < r.x1; x += 0.5) line(P(x, r.y0), P(x, r.y1), "rgba(0,0,0,.28)");
  }
}
function windowView(w, h, opts = {}) {
  const ph = dayPhase(), t = Date.now() / 1000;
  const top = { day: "#7d838b", dusk: "#3a3040", night: "#07080c" }[ph], low = { day: "#b9bdc2", dusk: "#7a4a4a", night: "#1c1f2a" }[ph];
  g.fillStyle = "#1b1b1f"; g.fillRect(-8, -8, w + 16, h + 16);
  const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, top); sky.addColorStop(1, low);
  g.fillStyle = sky; g.fillRect(0, 0, w, h);
  for (const b of SKY) {
    if (b.x > w) continue;
    g.fillStyle = ph === "day" ? "#55595f" : "#0c0d12"; g.fillRect(b.x, h - b.h, Math.min(b.w, w - b.x), b.h);
    g.fillStyle = "#d9b45a";
    if (ph !== "day") for (const [lx, ly, on] of b.lit) if (on > 0.55) g.fillRect(b.x + 2 + lx * (b.w - 5), h - b.h + 4 + ly * (b.h - 8), 2.5, 3.5);
  }
  if (opts.neon && ph !== "day" && Math.floor(t * 8) % 13) { g.fillStyle = "#e0262e"; g.font = "bold 16px serif"; g.fillText("HOT", w - 44, 40); }
  const wx = S.weather || {}; // real NYC weather from the server
  if (wx.rain) { g.strokeStyle = "rgba(200,210,220,.35)"; g.lineWidth = 1; for (const [rx, ry] of RAIN) { const y = ((ry + t * 1.4) % 1) * h, x = rx * w; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 2, y + 7); g.stroke(); } }
  if (wx.snow) { g.fillStyle = "rgba(240,240,245,.8)"; for (const [rx, ry] of RAIN) g.fillRect(rx * w + Math.sin(t + ry * 9) * 3, ((ry + t * 0.15) % 1) * h, 2, 2); }
  if (wx.fog) { g.fillStyle = "rgba(170,175,185,.35)"; g.fillRect(0, h * 0.4, w, h * 0.6); }
  if (opts.escape) { // fire escape
    g.strokeStyle = "#050505"; g.lineWidth = 3; g.beginPath(); g.moveTo(0, h * 0.78); g.lineTo(w, h * 0.78); g.moveTo(0, h * 0.62); g.lineTo(w, h * 0.62); g.stroke();
    for (let x = 6; x < w; x += 14) { g.beginPath(); g.moveTo(x, h * 0.62); g.lineTo(x, h * 0.78); g.stroke(); }
    if (dogVisible()) { // the black dog, sitting on the fire escape
      g.fillStyle = "#000"; g.beginPath(); g.ellipse(w * 0.3, h * 0.55, 16, 11, 0, 0, 7); g.fill();
      g.beginPath(); g.arc(w * 0.3 + 12, h * 0.42, 8, 0, 7); g.fill();
      g.beginPath(); g.moveTo(w * 0.3 + 8, h * 0.36); g.lineTo(w * 0.3 + 10, h * 0.28); g.lineTo(w * 0.3 + 14, h * 0.36); g.fill();
      g.fillStyle = "#e0262e"; g.fillRect(w * 0.3 + 14, h * 0.41, 2, 2);
    }
  }
  g.fillStyle = "#cfcac0"; for (let i = 0; i < 8; i++) g.fillRect(0, i * 6, w, 4); // blinds half down
  g.fillStyle = "#1b1b1f"; g.fillRect(w / 2 - 2, 0, 4, h);
}
function drawRoom() {
  ROOMS.forEach(drawFloor);
  if (owns("rug")) { // oxblood persian rug
    poly([P(1.2, 1.7), P(2.75, 1.7), P(2.75, 3.5), P(1.2, 3.5)], "#3b1416", EDGE);
    poly([P(1.35, 1.85), P(2.6, 1.85), P(2.6, 3.35), P(1.35, 3.35)], "#4a1c1f");
    poly([P(1.7, 2.3), P(2.25, 2.3), P(2.25, 2.9), P(1.7, 2.9)], "#5e2a24");
  }
  poly([P(0, D), P(W, D), P(W, D, -0.35), P(0, D, -0.35)], "#141418"); // floor slab edges
  poly([P(W, 0), P(W, D), P(W, D, -0.35), P(W, 0, -0.35)], "#0d0d10");
  poly([P(0, 0), P(0, D), P(0, D, RH), P(0, 0, RH)], "#3d3d45");
  poly([P(0, 0), P(W, 0), P(W, 0, RH), P(0, 0, RH)], "#33333a");
  for (let i = 0.25; i < D; i += 0.5) line(P(0, i), P(0, i, RH), "rgba(255,255,255,.03)", T * 0.08);
  for (let i = 0.25; i < W; i += 0.5) line(P(i, 0), P(i, 0, RH), "rgba(255,255,255,.025)", T * 0.08);
  poly([P(0, 0), P(0, D), P(0, D, 0.12), P(0, 0, 0.12)], "#151518");
  poly([P(0, 0), P(W, 0), P(W, 0, 0.12), P(0, 0, 0.12)], "#111114");
  faceY(0.01, 1.2, 3.0, 1.0, 2.4, (w, h) => windowView(w, h, { neon: true, escape: true }));
  faceY(0.01, 7.3, 8.7, 1.3, 2.3, (w, h) => windowView(w, h));
  faceX(0.01, 6.4, 7.4, 1.2, 2.2, (w, h) => windowView(w, h));
  faceY(0.01, 9, 10, 0, 2.1, (w, h) => { // front door: mail slot, peephole, light (and sometimes a shadow) under it
    g.fillStyle = "#2a1f18"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "#1a130f"; g.lineWidth = 3; g.strokeRect(12, 14, w - 24, 70); g.strokeRect(12, 100, w - 24, 90);
    g.fillStyle = "#b8a77a"; g.fillRect(w / 2 - 14, 92, 28, 4); g.beginPath(); g.arc(w - 18, 110, 4, 0, 7); g.fill(); g.beginPath(); g.arc(w / 2, 30, 2.5, 0, 7); g.fill();
    g.fillStyle = "rgba(255,200,120,.8)"; g.fillRect(0, h - 3, w, 3);
    g.fillStyle = S.doorLocked ? "#b8a77a" : "#e0262e"; g.fillRect(w - 26, 60, 14, 5); // deadbolt: brass when locked, red when open
    if (S.doorLocked) { g.strokeStyle = "#b8a77a"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(w - 30, 50); g.quadraticCurveTo(w - 40, 62, w - 30, 74); g.stroke(); }
    const s = (Date.now() / 1000) % 40; if (s < 3) { g.fillStyle = "#000"; g.fillRect(s / 3 * w - 15, h - 3, 18, 3); }
  });
  if (owns("cork")) faceY(0.01, 5.9, 6.9, 1.1, 2.1, (w, h) => { // conspiracy corkboard
    g.fillStyle = "#5a4a38"; g.fillRect(0, 0, w, h);
    const pins = [[14, 14], [60, 10], [30, 50], [75, 55], [50, 80]];
    pins.forEach(([x, y], i) => { g.fillStyle = "#d9d3c2"; g.fillRect(x - 8, y - 6, 18, 14); g.fillStyle = "#333"; g.font = "3px serif"; g.fillText(["BD-1", "LENA", "1999?", "NYSE", tr("CÃO")][i], x - 6, y + 2); });
    g.strokeStyle = "#e0262e"; g.lineWidth = 1.2; g.beginPath(); pins.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.lineTo(14, 14); g.stroke();
  });
  if (owns("clock")) faceX(0.01, 3.4, 3.9, 1.9, 2.4, (w, h) => { // wall clock with the real time
    const c = w / 2, d = nyc(); g.fillStyle = "#d8d4cc"; g.beginPath(); g.arc(c, c, 22, 0, 7); g.fill();
    g.strokeStyle = "#111"; g.lineWidth = 2;
    const hand = (a, l) => { g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.sin(a) * l, c - Math.cos(a) * l); g.stroke(); };
    hand((d.getHours() % 12 + d.getMinutes() / 60) / 12 * Math.PI * 2, 11); hand(d.getMinutes() / 60 * Math.PI * 2, 17);
  });
  faceY(0.01, 11.3, 11.9, 1.3, 2.0, (w, h) => { // calendar: today's date, in 1986
    const d = nyc(); g.fillStyle = "#e8e2d2"; g.fillRect(0, 0, w, h); g.fillStyle = "#b3141b"; g.fillRect(0, 0, w, 14);
    g.fillStyle = "#fff"; g.font = "bold 8px serif"; g.fillText(d.toLocaleDateString(LOCALE, { month: "short" }).toUpperCase() + " 1986", 4, 10);
    g.fillStyle = "#111"; g.font = "bold 30px serif"; g.fillText(d.getDate(), 10, 50);
    g.strokeStyle = "#b3141b"; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(4 + i * 11, 58); g.lineTo(12 + i * 11, 66); g.stroke(); }
  });
  faceY(0.01, 10.05, 10.32, 1.1, 1.55, (w, h) => { if (ringing) g.translate(Math.sin(Date.now() / 25) * 2, 0); g.fillStyle = "#7a1218"; g.fillRect(0, 0, w, h); g.fillStyle = "#111"; g.beginPath(); g.arc(w / 2, h / 2, 7, 0, 7); g.fill(); });
  if (S.bills.length) S.bills.slice(0, 5).forEach((b, i) => poly([P(9.2 + i * 0.1, 0.3 + i * 0.08), P(9.6 + i * 0.1, 0.3 + i * 0.08), P(9.6 + i * 0.1, 0.55 + i * 0.08), P(9.2 + i * 0.1, 0.55 + i * 0.08)], now() > b.due ? "#e8c4c4" : "#e8e2d2"));
  drawTrash();
}
function lampShade(p) { g.fillStyle = "#1b1b1f"; g.beginPath(); g.moveTo(p[0] - T * 0.3, p[1] + T * 0.25); g.lineTo(p[0] + T * 0.3, p[1] + T * 0.25); g.lineTo(p[0] + T * 0.1, p[1]); g.lineTo(p[0] - T * 0.1, p[1]); g.fill(); line([p[0], p[1]], [p[0], p[1] - T * 1.2], "#111", 1); }
const steamPuffs = [];
function steam(p) {
  if (Math.random() < 0.08) steamPuffs.push({ x: p[0], y: p[1], a: 0.4, r: T * 0.05 });
  for (let i = steamPuffs.length - 1; i >= 0; i--) {
    const s = steamPuffs[i]; s.y -= T * 0.01; s.r += T * 0.003; s.a -= 0.006; s.x += Math.sin(s.y) * 0.2;
    if (s.a <= 0) { steamPuffs.splice(i, 1); continue; }
    g.fillStyle = `rgba(220,220,220,${s.a})`; g.beginPath(); g.arc(s.x, s.y, s.r, 0, 7); g.fill();
  }
}

// Damped spring "pop" when a piece of furniture is upgraded.
const bounces = {};
function bounce(k) { bounces[k] = performance.now(); }
function spring(k) {
  const t0 = bounces[k]; if (!t0) return 1;
  const t = (performance.now() - t0) / 1000;
  if (t > 1.6) { delete bounces[k]; return 1; }
  return 1 + 0.3 * Math.exp(-5 * t) * Math.sin(20 * t);
}
function drawObj(o, bs) {
  const s = o.key && bounces[o.key] ? spring(o.key) : o.own ? spring(o.own) : 1;
  if (s !== 1) { const b = bs[0], [px, py] = P(b.x + b.w / 2, b.y + b.d / 2); g.save(); g.translate(px, py); g.scale(2 - s, s); g.translate(-px, -py); }
  bs.forEach(box); o.extra && o.extra(bs);
  if (s !== 1) g.restore();
}

// ---------- the black dog (rare visitor) ----------
let dogUntil = 0;
const dogVisible = () => Date.now() < dogUntil;

// ---------- noir lighting: darkness layer with light pools cut out of it ----------
function lights() {
  const ph = dayPhase(), on = !powerCut(), L = [];
  const add = (p, r, a = 1) => L.push([p, r, a]);
  add(P(2.1, 1.4), T * 2.4, ph === "day" ? 0.9 : 0.45); add(P(8.0, 1.4), T * 1.8, ph === "day" ? 0.8 : 0.35); add(P(0.8, 6.9), T * 1.6, ph === "day" ? 0.7 : 0.3);
  if (on) {
    if (owns("lamp") && !S.lampOff) add(P(0.5, 4.0, 0.4), T * 3.4);
    add(P(4.9, 0.6, 0.6), T * 1.6, 0.7); // BD-1's screen glow
    if (owns("desk")) add(P(5.4, 0.4, 0.8), T * 1.8);
    if (owns("ktable")) add(P(9.45, 2.4, 0.3), T * 3.2); else add(P(9.0, 1.5, 0.3), T * 2.2, 0.6); // bare bulb in the kitchen
    if (RACKS().length) add(P(10.4, 6.6, 0.5), T * 3.2, 0.8);
    add(P(0.3, 7.8, 0.6), T * 2.2, 0.8); add(P(5.5, 8, 0.4), T * 2.6, 0.8);
    if (tv) add(P(1.2, 2.7, 0.6), T * 3.2);
  }
  return L;
}
function drawDarkness(m) {
  const ph = dayPhase();
  dg.setTransform(1, 0, 0, 1, 0, 0); dg.globalCompositeOperation = "source-over"; dg.clearRect(0, 0, dk.width, dk.height);
  dg.setTransform(...m);
  dg.fillStyle = `rgba(3,3,8,${{ day: 0.42, dusk: 0.58, night: 0.68 }[ph]})`; dg.fillRect(-CW * 2, -CH * 2, CW * 6, CH * 6);
  dg.globalCompositeOperation = "destination-out";
  for (const [[x, y], r, a] of lights()) {
    const gr = dg.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, "rgba(0,0,0,0)");
    dg.fillStyle = gr; dg.fillRect(x - r, y - r, r * 2, r * 2);
  }
  dg.fillStyle = `rgba(0,0,0,${ph === "day" ? 0.55 : 0.3})`; // venetian-blind stripes across the living room floor
  for (let k = 0; k < 6; k++) {
    const y0 = 0.3 + k * 0.42, y1 = y0 + 0.2, s = (y) => y * 0.35, Q = (x, y) => P(x, y);
    const pts = [Q(1.2 + s(y0), y0), Q(3.0 + s(y0), y0), Q(3.0 + s(y1), y1), Q(1.2 + s(y1), y1)];
    dg.beginPath(); pts.forEach(([x, y], i) => i ? dg.lineTo(x, y) : dg.moveTo(x, y)); dg.fill();
  }
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(dk, 0, 0); g.restore();
}
function glows() {
  const ph = dayPhase(), t = Date.now() / 1000;
  g.globalCompositeOperation = "lighter";
  const glow = (p, r, c) => { const gr = g.createRadialGradient(p[0], p[1], 0, p[0], p[1], r); gr.addColorStop(0, c); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(p[0] - r, p[1] - r, r * 2, r * 2); };
  if (!powerCut()) {
    if (!S.lampOff) glow(P(0.5, 4, 1.55), T * 2.4, "rgba(255,190,110,.16)");
    glow(P(5.4, 0.4, 1.0), T * 1.0, "rgba(90,200,140,.12)");
    glow(P(9.45, 2.4, 1.6), T * 2, "rgba(255,200,130,.12)");
    if (tv) glow(P(0.8, 2.6, 0.9), T * 3, `rgba(180,200,255,${0.1 + Math.random() * 0.08})`);
  }
  if (ph !== "day" && Math.floor(t * 8) % 13) glow(P(2.1, 0.5, 1.5), T * 2.2, "rgba(220,20,30,.12)"); // neon from across the street
  if (S.radio) { glow(P(0.4, 5.3, 0.9), T * 1.4, "rgba(224,168,58,.18)"); g.globalCompositeOperation = "source-over"; g.fillStyle = "#d8d4cc"; g.font = `${T * 0.4}px serif`; const [x, y] = P(0.4, 4.9, 1.3); g.fillText("♪", x + Math.sin(t * 2) * 4, y - (t * 10 % 20)); }
  g.globalCompositeOperation = "source-over";
}

// ---------- camera ----------
const viewM = () => { const ox = CW / 2 - view.fx * view.z, oy = CH / 2 - view.fy * view.z; return [DPR * view.z, 0, 0, DPR * view.z, DPR * ox, DPR * oy]; };
const toWorld = (sx, sy) => [(sx - (CW / 2 - view.fx * view.z)) / view.z, (sy - (CH / 2 - view.fy * view.z)) / view.z];
const toScreen = (wx, wy) => [wx * view.z + CW / 2 - view.fx * view.z, wy * view.z + CH / 2 - view.fy * view.z];
function clampView() {
  view.z = Math.max(ZMIN, Math.min(ZMAX, view.z));
  view.fx = Math.max(OX - D * T, Math.min(OX + W * T, view.fx));
  view.fy = Math.max(OY - RH * T, Math.min(OY + (W + D) / 2 * T, view.fy));
}
function zoomAt(sx, sy, f) {
  const [wx, wy] = toWorld(sx, sy); view.z = Math.max(ZMIN, Math.min(ZMAX, view.z * f));
  view.fx = wx - (sx - CW / 2) / view.z; view.fy = wy - (sy - CH / 2) / view.z; clampView();
}
let camAnim = null;
function zoomTo(p, then) { if (!OPTS.motion) return then(); camAnim = { t: 0, from: { ...view }, to: { z: Math.max(view.z, 5), fx: p[0], fy: p[1] }, then }; }
function updateCam(dt) {
  const a = camAnim; if (!a) return 0;
  a.t = Math.min(1, a.t + dt / 0.9);
  const k = a.t * a.t * (3 - 2 * a.t);
  view.z = a.from.z * Math.pow(a.to.z / a.from.z, k); view.fx = a.from.fx + (a.to.fx - a.from.fx) * k; view.fy = a.from.fy + (a.to.fy - a.from.fy) * k;
  if (a.t >= 1) { camAnim = null; Object.assign(view, a.from); a.then(); return 0; }
  return Math.max(0, (k - 0.65) / 0.35);
}

// ---------- input: drag to pan, pinch / wheel to zoom, tap to act ----------
const ptrs = new Map(); let pinch = null, dragged = false, down = [0, 0];
cv.addEventListener("pointerdown", e => {
  cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.offsetX, e.offsetY]);
  if (ptrs.size === 1) { dragged = false; down = [e.offsetX, e.offsetY]; }
  if (ptrs.size === 2) { const [a, b] = [...ptrs.values()], mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: view.z, w: toWorld(...mid) }; dragged = true; }
});
cv.addEventListener("pointermove", e => {
  if (!ptrs.has(e.pointerId) || camAnim) return;
  const [px, py] = ptrs.get(e.pointerId); ptrs.set(e.pointerId, [e.offsetX, e.offsetY]);
  if (ptrs.size === 2 && pinch) {
    const [a, b] = [...ptrs.values()], mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    view.z = Math.max(ZMIN, Math.min(ZMAX, pinch.z * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch.d));
    view.fx = pinch.w[0] - (mid[0] - CW / 2) / view.z; view.fy = pinch.w[1] - (mid[1] - CH / 2) / view.z; clampView();
  } else if (ptrs.size === 1) {
    if (!dragged && Math.hypot(e.offsetX - down[0], e.offsetY - down[1]) > 8) dragged = true;
    if (dragged) { view.fx -= (e.offsetX - px) / view.z; view.fy -= (e.offsetY - py) / view.z; clampView(); }
  }
});
const endPtr = e => {
  if (!ptrs.has(e.pointerId)) return;
  ptrs.delete(e.pointerId);
  if (ptrs.size < 2) pinch = null;
  if (!ptrs.size && !dragged && e.type === "pointerup") tap(e.offsetX, e.offsetY);
};
cv.addEventListener("pointerup", endPtr); cv.addEventListener("pointercancel", endPtr);
cv.addEventListener("wheel", e => { e.preventDefault(); zoomAt(e.offsetX, e.offsetY, Math.exp(-e.deltaY * 0.0015)); }, { passive: false });
document.getElementById("recenter").addEventListener("click", () => { view.z = 1.9; [view.fx, view.fy] = P(dex.x, dex.y, 0.6); clampView(); });

const marks = [];
// What is under this screen point? Shared by taps and by the hover/press highlight.
function pickAt(sx, sy) {
  const [x, y] = toWorld(sx, sy), pad = 6 / view.z, near = 18 / view.z; // characters are small and move: fat-finger radius
  const hit = (b, p = pad) => b && x >= b[0] - p && x <= b[2] + p && y >= b[1] - p && y <= b[3] + p;
  if (roach) { const [rx, ry] = P(roach.x, roach.y, 0.02); if (Math.hypot(rx - x, ry - y) < T * 0.4 + near) return { kind: "roach", x: rx, y: ry }; }
  if (hit(cat.box, near)) return { kind: "cat" };
  if (dogVisible() && hit(byId("window").area())) return { kind: "obj", o: byId("window") };
  for (const i of S.trash) { const [tx, ty] = TRASH[i], [px, py] = P(tx, ty, 0.1); if (Math.hypot(px - x, py - y) < T * 0.35 + pad) return { kind: "trash", i }; }
  if (hit(dex.box, near)) return { kind: "dex" };
  const cands = O.filter(o => isLive(o) && !(o.minZoom && view.z < o.minZoom)).map(o => {
    const bs = o.boxes ? o.boxes() : null, area = o.area ? o.area() : bs && bs.length ? bbox(bs) : null;
    return { o, area, depth: bs && bs.length ? depthOf(bs) : 100 };
  }).filter(c => hit(c.area)).sort((a, b) => b.depth - a.depth || (a.area[2] - a.area[0]) - (b.area[2] - b.area[0]));
  if (cands.length) return { kind: "obj", o: cands[0].o };
  const a = (x - OX) / T, b = 2 * (y - OY) / T, fx = (a + b) / 2, fy = (b - a) / 2;
  if (fx > 0 && fy > 0 && fx < W && fy < D) return { kind: "floor", fx, fy, x, y };
  return null;
}
function tap(sx, sy) {
  if (camAnim) return;
  const tg = pickAt(sx, sy); if (!tg) return;
  tapFlash = { tg, until: Date.now() + 700 };
  if (tg.kind !== "dex") { dex.idle = -15; dex.cleaning = false; }
  if (tg.kind === "roach") return hitRoach(tg.x, tg.y);
  if (tg.kind === "cat") return petCat();
  if (tg.kind === "trash") return pickUp(tg.i);
  if (tg.kind === "dex") return say(pick(DEX_LINES));
  if (tg.kind === "obj") {
    if (tg.o.id === "tv") { if (tv || tvPending) return; tvPending = true; }
    if (use(tg.o) === false) tvPending = false; return;
  }
  if (walkTo(tg.fx, tg.fy)) marks.push({ x: tg.x, y: tg.y, t: 0 });
}

// Habbo/Sims-style feedback: whatever is under the mouse or finger gets a red outline; the floor tile lights up
let hover = null, tapFlash = null, HL = null; // HL: when set, poly() and cyl() only stroke the outline in this colour
cv.addEventListener("pointermove", e => { if (!ptrs.size && e.pointerType === "mouse") { hover = pickAt(e.offsetX, e.offsetY); cv.style.cursor = hover && hover.kind !== "floor" ? "pointer" : "grab"; } });
cv.addEventListener("pointerdown", e => { if (ptrs.size === 1) hover = pickAt(e.offsetX, e.offsetY); });
cv.addEventListener("pointerup", e => { if (e.pointerType !== "mouse") hover = null; });
cv.addEventListener("pointerleave", () => { hover = null; });
function drawHighlight(tg, strong) {
  const glow = strong ? 0.16 + 0.12 * Math.abs(Math.sin(Date.now() / 90)) : 0.1; // hover: barely there; tap: a short pulse
  const tint = `rgba(255,120,110,${glow})`, col = `rgba(224,38,46,${strong ? 0.8 : 0.5})`;
  const ring = (x, y, r) => { const [sx, sy] = P(x, y, 0.01); g.strokeStyle = col; g.lineWidth = 1.5 / view.z; g.beginPath(); g.ellipse(sx, sy, T * r, T * r / 2, 0, 0, 7); g.stroke(); };
  if (tg.kind === "obj") {
    const bs = tg.o.boxes ? tg.o.boxes() : null;
    if (bs && bs.length) { g.globalCompositeOperation = "lighter"; HL = tint; bs.forEach(box); HL = null; g.globalCompositeOperation = "source-over"; }
    else if (tg.o.area) { const a = tg.o.area(); if (a) { g.fillStyle = tint; g.fillRect(a[0], a[1], a[2] - a[0], a[3] - a[1]); } }
  } else if (tg.kind === "cat") ring(cat.x, cat.y, 0.38);
  else if (tg.kind === "dex") ring(dex.x, dex.y, 0.38);
  else if (tg.kind === "trash") ring(...TRASH[tg.i], 0.3);
  else if (tg.kind === "roach" && roach) ring(roach.x, roach.y, 0.25);
  else if (tg.kind === "floor") {
    const i = Math.floor(tg.fx / CELL) * CELL, j = Math.floor(tg.fy / CELL) * CELL;
    poly([P(i, j), P(i + CELL, j), P(i + CELL, j + CELL), P(i, j + CELL)], "rgba(224,38,46,.14)");
    g.strokeStyle = col; g.lineWidth = 1.2 / view.z; g.stroke();
  }
}

// ---------- UI pieces ----------
const floats = [];
function toast(text) { floats.push({ text: tr(text), t: 0 }); }
const overlayOpen = () => !!document.querySelector(".overlay:not([hidden])");

// TV (ads live here)
const tvEl = document.getElementById("tv"), tvScreen = document.getElementById("tvs"), tvc = document.getElementById("tvc");
let tv = null, tvPending = false;
function later(fn, ms) { tv.timers.push(setTimeout(fn, ms)); }
function tvOn() {
  tvPending = false;
  if (powerCut()) { say("Sem luz, sem TV. Ótimo."); return; }
  const ad = activeMods().find(m => m.sponsored && !S.claimed[m.id]);
  tv = { ad, timers: [] };
  S.needs.diversao = clamp100(S.needs.diversao + TV_FUN[tier("tv")]);
  tvEl.hidden = false; tvScreen.classList.remove("on"); void tvScreen.offsetWidth; tvScreen.classList.add("on");
  tvc.innerHTML = '<div class="noise"></div>';
  later(() => ad ? showAd(ad) : showNews(), 800);
}
function showAd(m) {
  const done = () => {
    if (!tv || tv.done) return; tv.done = true;
    claimAd(m.id);
    tvc.innerHTML = `<div class="ch">${tr("RELAXAMENTO")}</div><div class="brand pop" style="animation-delay:0s">×${S.bonus.mult}</div><div class="hl">${tr("{line} turbinado por {m} min.", { line: LINES[m.line].name, m: m.reward.dur_min })}</div>`;
    say("Ahh... agora sim. BD-1, acelera aí.");
  };
  if (m.video) { tvc.innerHTML = `<video src="${esc(m.video)}" autoplay muted playsinline></video>`; tvc.querySelector("video").onended = done; return; }
  tvc.innerHTML = `<div class="adbg"></div><div class="noise grain"></div><div class="ch">${tr("CANAL 4 · COMERCIAL")}</div><div class="brand pop">${esc(m.advertiser)}</div>
    <div class="hl"></div><div class="slogan">${esc(m.slogan || "")}</div><div class="bar"><b></b></div>`;
  later(() => { const b = tvc.querySelector(".bar b"); if (b) b.style.width = "100%"; }, 30);
  const hl = tvc.querySelector(".hl");
  for (let i = 1; i <= m.headline.length; i++) later(() => { hl.textContent = m.headline.slice(0, i); }, 1400 + i * 35);
  later(done, 7000);
}
function showNews() {
  const m = pick(activeMods().filter(x => !x.sponsored).concat([null]));
  tvc.innerHTML = `<div class="ch">${tr("CANAL 7 · PLANTÃO")}</div><div class="hl">${m ? esc(m.headline) : tr("Sem novidades. Só reprise de filme policial.")}</div>`;
}
function tvOff() { if (tv) tv.timers.forEach(clearTimeout); tv = null; tvEl.hidden = true; dex.idle = 6; }
tvEl.addEventListener("click", e => { if (!e.target.closest(".crt")) tvOff(); });

// newspaper: today's real headlines, printed in 1986
const paperEl = document.getElementById("paper"), paperc = document.getElementById("paperc");
function openPaper() {
  const ms = activeMods(), news = ms.filter(m => !m.sponsored).sort((a, b) => Math.abs(b.mult - 1) - Math.abs(a.mult - 1)), ad = ms.find(m => m.sponsored);
  const date = nyc().toLocaleDateString(LOCALE, { weekday: "long", day: "numeric", month: "long" }) + tr(" de 1986");
  const tip = m => `<span class="${m.mult >= 1 ? "up" : "down"}">${m.mult >= 1 ? "▲" : "▼"} ${LINES[m.line].name} ${tr(m.mult >= 1 ? "em alta" : "em baixa")}</span>`;
  paperc.innerHTML = `<div class="mast">The New York Signal</div><div class="dateline">${tr("{date} · 25 centavos", { date })}</div>
    ${news[0] ? `<h3 class="lead">${esc(news[0].headline)}</h3><p class="tip">${tip(news[0])}</p>` : `<p>${tr("Edição sem manchetes.")}</p>`}
    <div class="cols">${news.slice(1).map(m => `<div><h4>${esc(m.headline)}</h4><p class="tip">${tip(m)}</p></div>`).join("")}
    ${ad ? `<div class="classified"><b>${tr("ANÚNCIO")}</b><br>${esc(ad.advertiser)}: ${esc(ad.headline)}</div>` : ""}</div>`;
  paperEl.hidden = false;
}
paperEl.addEventListener("click", e => { if (!e.target.closest(".news-paper")) paperEl.hidden = true; });

// bills under the door
const billsEl = document.getElementById("bills"), billsc = document.getElementById("billsc");
function openBills() {
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

// buy catalog: Sims-style, each item drawn by the same code that draws it in the room
const shopEl = document.getElementById("shop"), shopc = document.getElementById("shopc");
const SHOP_BOXES = { pc: DESKB, cama: BEDB, geladeira: FRIDGEB, tv: TVB };
function thumb(c, bs) {
  const prev = [g, T, OX, OY], ctx = c.getContext("2d"), dpr = window.devicePixelRatio || 1;
  c.width = 96 * dpr; c.height = 80 * dpr;
  g = ctx; T = 1; OX = 0; OY = 0;
  const [x0, y0, x1, y1] = bbox(bs), s = Math.min(80 / (x1 - x0), 64 / (y1 - y0));
  T = s; OX = 48 - (x0 + x1) / 2 * s; OY = 40 - (y0 + y1) / 2 * s;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = "#1a1a1e"; ctx.fillRect(0, 0, 96, 80);
  bs.forEach(box);
  [g, T, OX, OY] = prev;
}
SHOP_BOXES.pc = t => pcBoxes(t, 0);
const boxesFor = key => O.filter(o => o.own === key && o.boxes).flatMap(o => o.boxes());
const GLYPH = { rug: "▦", clock: "◷", cork: "✎" }; // wall/floor decor without 3D boxes
function openShop() {
  const rooms = [...new Set(CATALOG.map(c => c.room))];
  const upgrades = Object.entries(FURN_UP).filter(([k]) => k === "pc" || k === "geladeira" || (k === "tv" && owns("tv")) || (k === "cama" && owns("bed")));
  shopc.innerHTML = rooms.map(room => `<div class="shop-cat"><h3>${room}</h3><div class="shop-row">` + CATALOG.filter(c => c.room === room).map(c => {
    const own = owns(c.key);
    return `<div class="shop-item ${own ? "own" : ""}"><canvas data-key="${c.key}"></canvas><div class="name">${c.name}</div><div class="sub">${c.desc}</div>
      ${own ? `<button class="sell" data-sell="${c.key}">${tr("Vender {v}", { v: fmtUSD(sellValue(c.key)) })}</button>` : `<button data-buyi="${c.key}" ${S.usd < c.price ? "disabled" : ""}>${fmtUSD(c.price)}</button>`}</div>`;
  }).join("") + "</div></div>").join("")
  + `<div class="shop-cat"><h3>${tr("Melhorias")}</h3>` + upgrades.map(([k, f]) => `<div class="shop-row">` + f.tiers.map((name, t) => {
    const own = S.furn[k] >= t, next = S.furn[k] + 1 === t;
    return `<div class="shop-item ${own ? "own" : ""}"><canvas data-k="${k}" data-t="${t}"></canvas><div class="name">${f.name}: ${name}</div><div class="sub">${f.fx[t]}</div>
      ${own ? `<span class="tag">${tr(S.furn[k] === t ? "EM USO" : "SUPERADO")}</span>` : `<button data-shop="${k}" ${!next || S.usd < f.cost[t] ? "disabled" : ""}>${fmtUSD(f.cost[t])}</button>`}</div>`;
  }).join("") + "</div>").join("") + `</div><p class="sub">${tr("Revender devolve menos: 75% no dia da compra, caindo 5% ao dia até 40%.")}</p>`;
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
  const b = e.target.closest("[data-shop]"), bi = e.target.closest("[data-buyi]"), sl = e.target.closest("[data-sell]");
  if (b) { if (!b.disabled && buyFurn(b.dataset.shop)) { toast("Melhoria instalada"); openShop(); } return; }
  if (bi) { if (!bi.disabled && buyItem(bi.dataset.buyi)) { toast("Comprado"); say("Até que ficou bom."); openShop(); } return; }
  if (sl) { const v = sellItem(sl.dataset.sell); if (v) { toast(tr("Vendido por {v}", { v: fmtUSD(v) })); openShop(); } return; }
  if (e.target === shopEl || e.target.closest(".close")) shopEl.hidden = true;
});
document.getElementById("shopbtn").addEventListener("click", openShop);

// radio: real internet stations (Radio Browser, free, no key), keeps playing while the game is open
const radioEl = document.getElementById("radio"), radioc = document.getElementById("radioc"), audio = new Audio();
const GENRES = { jazz: "Jazz", blues: "Blues", noir: "Noir", lounge: "Lounge", classical: "Clássica", news: "Notícias" };
for (const k in GENRES) GENRES[k] = tr(GENRES[k]);
let station = null, curTag = "jazz"; // station: { url, name, meta }
audio.onplay = audio.onpause = () => { S.radio = station && !audio.paused ? station.name : null; renderNow(); };
audio.onerror = () => { if (station) toast("Estação fora do ar"); };
async function loadStations(tag) {
  curTag = tag;
  radioc.querySelectorAll("[data-tag]").forEach(b => b.classList.toggle("on", b.dataset.tag === tag));
  const box = radioc.querySelector(".stations"); box.innerHTML = `<p class="sub">${tr("Sintonizando...")}</p>`;
  try {
    const r = await fetch(`https://de1.api.radio-browser.info/json/stations/search?tag=${tag}&limit=30&hidebroken=true&order=clickcount&reverse=true`);
    const list = (await r.json()).filter(s => s.url_resolved && (location.protocol === "http:" || s.url_resolved.startsWith("https")));
    box.innerHTML = list.map(s => {
      const meta = [s.countrycode, s.bitrate ? s.bitrate + " kbps" : ""].filter(Boolean).join(" · ");
      return `<div class="station ${station && station.url === s.url_resolved ? "on" : ""}" data-url="${esc(s.url_resolved)}" data-name="${esc(s.name.trim())}" data-meta="${esc(meta)}">
        <span class="st-name">${esc(s.name.trim())}</span><span class="st-meta">${esc(meta)}</span></div>`;
    }).join("") || `<p class="sub">${tr("Nada nessa frequência.")}</p>`;
    renderNow();
  } catch (e) { box.innerHTML = `<p class="sub">${tr("Sem sinal. Verifique a conexão.")}</p>`; }
}
function renderNow() {
  const el = radioc.querySelector(".np"); if (!el) return;
  const playing = station && !audio.paused;
  el.innerHTML = `<div class="np-label ${playing ? "live" : ""}">${tr(playing ? "● NO AR" : station ? "PAUSADO" : "DESLIGADO")}</div>
    <div class="np-name">${station ? esc(station.name) : tr("Gire o dial: escolha uma estação")}</div><div class="np-sub">${station ? esc(station.meta) : "&nbsp;"}</div>`;
  const pb = radioc.querySelector("[data-play]"); if (pb) { pb.textContent = playing ? "❚❚" : "▶"; pb.disabled = !station; }
  const items = [...radioc.querySelectorAll(".station")];
  items.forEach(s => s.classList.toggle("on", !!station && s.dataset.url === station.url));
  const i = items.findIndex(s => station && s.dataset.url === station.url), nd = radioc.querySelector(".rc-needle"); // tuning needle slides to the station
  if (nd) nd.style.left = (i < 0 ? 3 : 3 + i / Math.max(1, items.length - 1) * 94) + "%";
}
// the radio opens face-on like the TV: bakelite pocket radio, or the vitrola's wooden console once bought
function openRadio() {
  const ad = !owns("tv") && activeMods().find(m => m.sponsored && !S.claimed[m.id]); // no TV yet: the sponsored spot airs on the radio
  radioc.className = "radio-cab " + (owns("records") ? "wood" : "bakelite");
  radioc.innerHTML = `<div class="rc-top"><span class="rc-brand">${owns("records") ? "BLACK DOG · HI-FI" : "ROYALE 7 · TRANSISTOR"}</span><button class="rc-x" data-close aria-label="Fechar">✕</button></div>
    <div class="rc-dial">
      <div class="np"></div>
      <div class="rc-scale"><span>55</span><span>70</span><span>90</span><span>110</span><span>130</span><span>160</span><i class="rc-needle"></i></div>
      <div class="stations"></div>
    </div>
    ${ad ? `<div class="radio-ad" id="radioad"><div><b>${tr("COMERCIAL")} · ${esc(ad.advertiser)}</b><div class="rc-small">${tr("ouça e ganhe ×{m} por {d} min", { m: ad.reward.mult, d: ad.reward.dur_min })}</div></div><button data-adlisten="${ad.id}">${tr("Ouvir")}</button></div>` : ""}
    <div class="genres">${Object.entries(GENRES).map(([k, v]) => `<button data-tag="${k}">${v}</button>`).join("")}</div>
    <div class="rc-bottom">
      <div class="rc-grille"></div>
      <div class="rc-controls">
        <button class="rc-knob" data-play aria-label="Tocar ou pausar">▶</button>
        <label class="rc-vol"><span>VOLUME <b class="np-volv">${Math.round(OPTS.volume * 100)}%</b></span><input type="range" min="0" max="1" step="0.05" value="${OPTS.volume}" data-vol></label>
      </div>
    </div>`;
  radioEl.hidden = false; renderNow(); loadStations(curTag);
}
radioc.addEventListener("input", e => {
  if (!e.target.closest("[data-vol]")) return;
  OPTS.volume = +e.target.value; saveOpts(); radioc.querySelector(".np-volv").textContent = Math.round(OPTS.volume * 100) + "%";
});
// click (not pointerdown) so scrolling the station list never changes the station
radioEl.addEventListener("click", e => {
  const tag = e.target.closest("[data-tag]"), st = e.target.closest(".station"), adb = e.target.closest("[data-adlisten]");
  if (e.target.closest("[data-vol]")) return;
  if (e.target.closest("[data-close]") || !e.target.closest(".radio-cab")) { radioEl.hidden = true; return; }
  if (e.target.closest("[data-play]")) { if (station) audio.paused ? audio.play().catch(() => toast("Estação fora do ar")) : audio.pause(); return; }
  if (adb) {
    const m = S.mods[adb.dataset.adlisten], box = radioc.querySelector("#radioad"); let t = 7;
    box.innerHTML = `<div><b>${tr("COMERCIAL")} · ${esc(m.advertiser)}</b><div class="sub"><i>"${esc(m.slogan || m.headline)}"</i> · <span class="tip">${tr("no ar... {t}s", { t })}</span></div></div>`;
    const iv = setInterval(() => {
      if (--t > 0) { const s = box.querySelector(".tip"); if (s) s.textContent = tr("no ar... {t}s", { t }); return; }
      clearInterval(iv); claimAd(m.id); box.innerHTML = `<b>${tr("Bônus ×{m} em {line} por {d} min", { m: S.bonus.mult, line: LINES[m.line].name, d: m.reward.dur_min })}</b>`; say("Bom comercial, até.");
    }, 1000);
    return;
  }
  if (tag) return loadStations(tag.dataset.tag);
  if (st) { station = { url: st.dataset.url, name: st.dataset.name, meta: st.dataset.meta }; audio.src = station.url; audio.play().catch(() => toast("Estação fora do ar")); renderNow(); }
});
S.radio = null; // audio can't autoplay after a reload

// exchange: sell mined BDC for dollars (or gamble dollars back into BDC); every trade pays a fee
const exchEl = document.getElementById("exch"), exchc = document.getElementById("exchc");
function openExch() {
  const h = S.hist.length ? S.hist : [S.price], chg = (S.price / h[0] - 1) * 100;
  exchc.innerHTML = `<div class="mast" style="font-size:26px">${tr("Corretora Black Dog")}</div>
    <div class="dateline">${tr("BDC / US$ · taxa de {f}% por operação", { f: FEE * 100 })}</div>
    <div class="row"><b style="font:700 26px 'Special Elite',monospace">${fmtUSD(S.price)}</b><span class="${chg >= 0 ? "up" : "down"}">${chg >= 0 ? "▲" : "▼"} ${tr("{p}% em 2h", { p: Math.abs(chg).toFixed(1) })}</span></div>
    <p class="tip">${S.market ? tr("Cotação real: 1 BDC = BTC/US$ ÷ 100.000 (BTC a ${b}, fonte {s})", { b: Math.round(S.market.btc).toLocaleString("en-US"), s: S.market.source }) : tr("Aguardando cotação do servidor...")}</p>
    <canvas id="chart"></canvas>
    <p class="tip">${tr("Você tem {b} BDC (≈ {u}) e {d}", { b: fmt(S.cycles), u: fmtUSD(S.cycles * S.price), d: fmtUSD(S.usd) })}</p>
    <div class="sub">${tr("Vender BDC")}</div><div class="trade">${[0.25, 0.5, 1].map(f => `<button data-sell="${f}">${f * 100}%</button>`).join("")}</div>
    <div class="sub">${tr("Comprar BDC com dólares")}</div><div class="trade buy">${[0.25, 0.5, 1].map(f => `<button data-buyb="${f}">${f * 100}%</button>`).join("")}</div>
    <p class="sub">${tr("Segue o mercado real minuto a minuto. Crashes de verdade acontecem. Quem vende no pânico perde.")}</p>`;
  exchEl.hidden = false;
  const c = exchc.querySelector("#chart"), x = c.getContext("2d"), dpr = window.devicePixelRatio || 1, w = c.clientWidth, ht = c.clientHeight;
  c.width = w * dpr; c.height = ht * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
  const lo = Math.min(...h), hi = Math.max(...h), sy = v => ht - 10 - (v - lo) / (hi - lo || 1) * (ht - 22);
  x.strokeStyle = "#1b1b1b"; x.lineWidth = 1.5; x.beginPath();
  h.forEach((v, i) => { const px = h.length > 1 ? i / (h.length - 1) * w : w / 2; i ? x.lineTo(px, sy(v)) : x.moveTo(px, sy(v)); }); x.stroke();
  x.fillStyle = "#9a1418"; x.font = "11px 'Special Elite', monospace"; x.fillText(fmtUSD(hi), 4, 12); x.fillText(fmtUSD(lo), 4, ht - 3);
}
exchEl.addEventListener("pointerdown", e => {
  const s = e.target.closest("[data-sell]"), b = e.target.closest("[data-buyb]");
  if (s) { const usd = sellBDC(S.cycles * +s.dataset.sell); if (usd) toast("+" + fmtUSD(usd)); return openExch(); }
  if (b) { const bdc = buyBDC(S.usd * +b.dataset.buyb); if (bdc) toast("+" + fmt(bdc) + " BDC"); return openExch(); }
  if (!e.target.closest(".news-paper")) exchEl.hidden = true;
});
document.getElementById("exchbtn").addEventListener("click", openExch);
function marketEvent(ev, pct) {
  toast(tr(ev === "crash" ? "CRASH: BDC {p}% na hora" : "BDC DISPARA +{p}% na hora", { p: pct.toFixed(1) }));
  say(ev === "crash" ? "O BDC desabou. Alguém sabia antes. Sempre tem alguém." : "O BDC disparou! Vende agora ou espera mais?", 6000);
  if (!exchEl.hidden) openExch();
}
setInterval(() => { if (!exchEl.hidden) openExch(); }, 10000);

// the phone: brokers with "sure things". Most of them are scams (expected return 0.8×).
const callEl = document.getElementById("call"), callc = document.getElementById("callc");
const CALLERS = [
  { name: "Sal 'Sorriso' Benedetti, corretor", pitch: "Garoto, tenho uma dica quente: ações da Vidrion antes do anúncio. Coisa certa.", mult: 3 },
  { name: "Voz sem nome", pitch: "Eu sei o que o BD-1 faz. Me adianta um dinheiro e eu dobro antes da meia-noite.", mult: 2 },
  { name: "Madame Zora, consultora financeira", pitch: "As cartas não mentem, querido: Cumulus Corp. Agora ou nunca.", mult: 4 },
];
for (const c of CALLERS) { c.name = tr(c.name); c.pitch = tr(c.pitch); }
let ringing = false;
S.deals = S.deals || [];
setInterval(() => {
  if (!ringing && !gameOver && Math.random() < 0.08) { ringing = true; say("O telefone. Quem liga a essa hora?"); setTimeout(() => { ringing = false; }, 45000); }
}, 60000);
function answerCall() {
  ringing = false;
  const stake = Math.max(5, Math.round(S.usd * 0.4)), c = pick(CALLERS);
  callc.innerHTML = `<div class="mast" style="font-size:24px">${tr("Ligação")}</div><p><i>"${c.pitch}"</i></p><p class="tip">— ${c.name}</p>
    <p>${tr("Investir <b>{v}</b>? Retorno prometido: <b>{m}×</b> em 2 minutos.", { v: fmtUSD(stake), m: c.mult })}</p>
    <div class="trade"><button data-deal="${stake}" data-mult="${c.mult}" ${S.usd < stake ? "disabled" : ""}>${tr("Aceitar")}</button><button data-hang style="background:#1b1b1b">${tr("Desligar")}</button></div>`;
  callEl.hidden = false;
}
callEl.addEventListener("pointerdown", e => {
  const d = e.target.closest("[data-deal]");
  if (d && !d.disabled) {
    const stake = +d.dataset.deal; S.usd -= stake;
    S.deals.push({ stake, mult: +d.dataset.mult, at: now() + 120000 }); save();
    say("Feito. Agora é rezar."); callEl.hidden = true; return;
  }
  if (e.target.closest("[data-hang]") || !e.target.closest(".news-paper")) { callEl.hidden = true; say("Golpista. Essa cidade tá cheia."); }
});
setInterval(() => {
  for (const d of S.deals.filter(x => now() >= x.at)) {
    if (Math.random() < 0.8 / d.mult) { S.usd += d.stake * d.mult; toast(tr("Deu certo! +{v}", { v: fmtUSD(d.stake * d.mult) })); say("Não acredito. Deu certo."); }
    else { toast(tr("O corretor sumiu com {v}", { v: fmtUSD(d.stake) })); say("Número desligado. Levaram meu dinheiro. Clássico."); }
  }
  S.deals = S.deals.filter(x => now() < x.at);
}, 2000);
if (S.burgled) { const lost = S.burgled; S.burgled = 0; setTimeout(() => say(tr("Alguém entrou aqui. Levaram {v}. A porta estava destrancada.", { v: fmtUSD(lost) }), 7000), 2500); }

// bottom-tab sheets (production, news)
for (const [btn, id] of [["prodbtn", "prod"], ["newsbtn", "newsov"]]) {
  const el = document.getElementById(id);
  document.getElementById(btn).addEventListener("click", () => { el.hidden = false; if (id === "newsov") renderNews(); });
  el.addEventListener("pointerdown", e => { if (e.target === el || e.target.closest(".close")) el.hidden = true; });
}

function bubble(text, x, y) {
  g.font = "italic 600 12px Georgia, serif"; const pad = 7, maxW = Math.min(210, CW - 24), lines = [];
  let cur = "";
  for (const w of text.split(" ")) { const t = cur ? cur + " " + w : w; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  lines.push(cur);
  const bw = Math.max(...lines.map(l => g.measureText(l).width)) + pad * 2, bh = lines.length * 15 + pad * 2 - 3;
  const bx = Math.max(6, Math.min(x - bw / 2, CW - bw - 6)), by = Math.max(4, y - bh - 8);
  g.fillStyle = "#e8e4dc"; g.strokeStyle = "#000"; g.lineWidth = 1.5;
  g.beginPath(); g.roundRect(bx, by, bw, bh, 2); g.fill(); g.stroke();
  g.fillStyle = "#111"; lines.forEach((l, i) => g.fillText(l, bx + pad, by + pad + 11 + i * 15));
}

// ---------- Sombra, the black cat ----------
// wanders, naps on the softest thing around, eats from the bowl, knocks things over, and—if he likes you—reads the real news
const CAT_FOOD = 1.5;
const cat = { x: 2.5, y: 4.6, path: [], state: "idle", until: Date.now() + 3000, face: 1, walk: 0, say: "", sayUntil: 0, tipT: 40 };
const AI_RX = /(\b(ai|ia|a\.i\.|openai|llms?|gpt\w*|chatgpt|anthropic|claude|gemini|copilot|chatbots?|agents?|agentes?|nvidia|machine learning)\b|inteligência artificial)/i;
function catGo(x, y, state, ms) {
  const p = findPath(cat.x, cat.y, x, y);
  if (!p) return false;
  Object.assign(cat, { path: p, next: state, nextMs: ms }); cat.state = "walk"; return true;
}
function catNap() { // the best bed in the house, by cat standards
  const spot = owns("bed") ? [1.6, 8.9, 0.55] : owns("sofa") ? [3.25, 2.3, 0.45] : owns("armchair") ? [1.42, 5.4, 0.45] : [1.2, 8.8, 0.2];
  if (catGo(spot[0] + 0.3, spot[1], "sleep", 20000 + Math.random() * 20000)) { cat.napZ = spot[2]; cat.napAt = spot; }
}
function catSay(text, ms = 3500) { cat.say = tr(text); cat.sayUntil = Date.now() + ms; }
// Knocking things over, for real: walk to a surface, jump up, paw at the item, it falls in an arc and becomes trash on the floor.
// at = floor spot next to the furniture, top = where he stands on it, land = trash spot the item ends up in
const KNOCK = () => [
  { at: [8.35, 1.25], top: [8.35, 0.45, 0.9], land: 5 },  // stove
  { at: [7.55, 1.25], top: [7.55, 0.45, 0.9], land: 7 },  // kitchen sink
  { at: [2.1, 0.8], top: [2.1, 0.12, 0.55], land: 4 },    // radiator under the window
  { at: [4.95, 1.95], top: [5.5, 0.55, owns("desk") ? 0.75 : 0.56], land: 2 }, // BD-1's desk
].filter(k => !S.trash.includes(k.land));
let falling = null; // { i, from:[x,y,z], to:[x,y], t0 }
function catKnock() {
  const k = pick(KNOCK()); if (!k || S.trash.length >= 10) return false;
  if (!catGo(...k.at, "knock", 0)) return false;
  cat.knock = { k, t0: 0 }; return true;
}
function updateKnock(now) {
  const kn = cat.knock, k = kn.k; if (!kn.t0) kn.t0 = now;
  const e = now - kn.t0, ease = v => v * v * (3 - 2 * v);
  if (e < 350) { const s = ease(e / 350); cat.x = k.at[0] + (k.top[0] - k.at[0]) * s; cat.y = k.at[1] + (k.top[1] - k.at[1]) * s; cat.z = k.top[2] * s + Math.sin(s * Math.PI) * 0.3; } // jump up
  else if (e < 1500) { cat.z = k.top[2]; cat.paw = Math.floor(e / 180) % 2 === 0; if (!kn.eyed) { kn.eyed = true; catSay("..."); } } // paw, paw, look at Dex, paw
  else if (!kn.pushed) { kn.pushed = true; cat.paw = true; falling = { i: k.land, from: [k.top[0] + 0.15, k.top[1] + 0.2, k.top[2]], to: TRASH[k.land], t0: now }; }
  else if (e < 3200) { cat.paw = false; }
  else if (e < 3550) { const s = ease((e - 3200) / 350); cat.x = k.top[0] + (k.at[0] - k.top[0]) * s; cat.y = k.top[1] + (k.at[1] - k.top[1]) * s; cat.z = k.top[2] * (1 - s) + Math.sin(s * Math.PI) * 0.2; } // hop down
  else { cat.z = 0; cat.knock = null; cat.state = "idle"; cat.until = now + 4000; }
}
function updateFalling(now) {
  if (!falling) return;
  const k = Math.min(1, (now - falling.t0) / 650), [x0, y0, z0] = falling.from, [x1, y1] = falling.to;
  falling.pos = [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k, Math.max(0, z0 * (1 - k * k) + 0.35 * Math.sin(k * Math.PI))];
  if (k < 1) return;
  if (!S.trash.includes(falling.i)) S.trash.push(falling.i);
  falling = null; shakeUntil = now + 300; toast("CRASH!");
  catSay("Mrr.", 2000);
  setTimeout(() => say(pick(["SOMBRA! Desce daí!", "Ele olhou pra mim e derrubou. Olhando pra mim.", "Gato preto, sete vidas, zero modos."])), 450);
}
function catTip() {
  const a = S.cat.aff, news = activeMods().filter(m => !m.sponsored), ai = news.filter(m => AI_RX.test(m.headline));
  const m = ai.length && Math.random() < 0.6 ? pick(ai) : pick(news); // he has a soft spot for AI news
  if (a < 20 || !m) return ["Miau.", pick(["Ele me ignora. Típico de gato.", "Nem um olhar. Preciso conquistar esse bicho."])];
  const dir = tr(m.mult >= 1 ? "subir" : "cair");
  if (a < 50) return ["Miau?", tr("O Sombra não tira os olhos do {obj}... {line} vai {dir}?", { obj: tr(m.line === "hardware" ? "computador" : m.line === "software" ? "monitor" : "arquivo"), line: LINES[m.line].name, dir })];
  if (a < 80 || !S.market) return ["Miau!", tr("Acho que ele quer dizer: \"{h}\" ({s}). {line} vai {dir}.", { h: m.headline, s: m.source || tr("rádio"), line: LINES[m.line].name, dir })];
  const ch = S.market.change1h;
  return ["Mrrrau.", tr("\"{h}\" ({s}). E o BDC {move} na última hora. {advice}", { h: m.headline, s: m.source, move: Math.abs(ch) < 0.1 ? tr("ficou parado") : tr(ch >= 0 ? "subiu {p}%" : "caiu {p}%", { p: Math.abs(ch).toFixed(1) }), advice: tr(ch >= 1 ? "Ele acha que é hora de vender um pouco." : ch <= -1 ? "Ele diz: nada de vender no pânico." : "Ele diz: espera.") })];
}
function updateCat(dt) {
  const c = S.cat, now = Date.now();
  c.hunger = Math.max(0, c.hunger - 0.008 * dt);
  if (c.hunger <= 0) c.aff = Math.max(0, c.aff - 0.004 * dt); // a starving cat stops liking you
  if (cat.path.length) {
    const [tx, ty] = cat.path[0], dx = tx - cat.x, dy = ty - cat.y, dist = Math.hypot(dx, dy);
    if (dist < 0.03) {
      cat.x = tx; cat.y = ty; cat.path.shift();
      if (!cat.path.length) {
        cat.state = cat.next || "idle"; cat.until = now + (cat.nextMs || 4000);
        if (cat.state === "sleep" && cat.napAt) [cat.x, cat.y] = cat.napAt; // hops up onto the bed/sofa
        if (cat.state === "eat") cat.face = -1;
      }
    }
    else { const s = Math.min(dist, 1.1 * dt); cat.x += dx / dist * s; cat.y += dy / dist * s; cat.walk += dt * 9; const sx = (dx - dy); if (Math.abs(sx) > 0.01) cat.face = sx > 0 ? 1 : -1; }
    return;
  }
  if (cat.state === "eat") { if (now > cat.until) { const k = Math.min(c.bowl, 50); c.bowl -= k; c.hunger = Math.min(100, c.hunger + k); cat.state = "idle"; cat.until = now + 3000; } return; }
  if (cat.state === "petted" && now < cat.until) return;
  if (cat.state === "knock" && cat.knock) return updateKnock(now);
  if (now < cat.until) return;
  // decide what's next (a pause first, so a failed path never retries every frame)
  cat.until = now + 2000; cat.napAt = null; cat.z = 0; cat.paw = false; cat.knock = null;
  const r = Math.random();
  if (c.hunger < 50 && c.bowl > 0) catGo(11.62, 3.85, "eat", 4000);
  else if (c.hunger < 25) { catSay("MIAU!"); setTimeout(() => say(pick(["Tá, tá, já vou pôr ração.", "Esse olhar de julgamento de novo..."])), 900); cat.until = now + 25000; }
  else if (c.aff > 60 && r < 0.3 && !dex.sleeping) catGo(dex.x + 0.5, dex.y + 0.3, "idle", 6000); // follows you around
  else if (r < 0.45) catNap();
  else if (r < 0.52 && catKnock()) { /* off to push something onto the floor */ }
  else { const rm = pick(ROOMS); catGo(rm.x0 + 0.6 + Math.random() * (rm.x1 - rm.x0 - 1.2), rm.y0 + 0.6 + Math.random() * (rm.y1 - rm.y0 - 1.2), "idle", 3000 + Math.random() * 6000); }
}
function catTipTick(dt) {
  cat.tipT -= dt;
  if (cat.tipT > 0 || overlayOpen() || S.cat.hunger < 25) return;
  cat.tipT = 150 - S.cat.aff; // 150s at no affection, 50s at full
  const [meow, line] = catTip(); catSay(meow); setTimeout(() => say(line, 7000), 1100);
}
function petCat() {
  const c = S.cat, now = Date.now();
  Object.assign(cat, { path: [], state: "petted", until: now + 8000, z: 0, paw: false, knock: null }); // he waits for the hand (he knows)
  catSay(pick(["Mrr?", "...", "Miau?"]), 1500);
  walkTo(cat.x + 0.45, cat.y + 0.15, () => {
    cat.state = "petted"; cat.until = Date.now() + 3500; cat.path = [];
    busy(1600, () => {
      if (now - (c.lastPet || 0) < 15000) { c.aff = Math.max(0, c.aff - 2); catSay("HSSS!"); say("Ai! Arranhão. Ok, ok, chega de carinho."); }
      else {
        c.aff = Math.min(100, c.aff + 6); S.needs.diversao = clamp100(S.needs.diversao + 6); catSay("Purrr..."); hearts(cat.x, cat.y);
        found("cat", "Uma coleira escondida no pelo. Na plaqueta: 'SOMBRA · BD-0'.");
      }
      c.lastPet = Date.now(); save();
    }, "pet");
  });
}
const heartFx = [];
function hearts(x, y) { for (let i = 0; i < 4; i++) heartFx.push({ x, y, t: -i * 0.15, dx: (Math.random() - 0.5) * 0.4 }); }
function drawCat() {
  const u = T / 8, t = Date.now() / 1000, sleep = cat.state === "sleep" && !cat.path.length, z = sleep ? cat.napZ || 0 : cat.z || 0;
  const [x, y] = P(cat.x, cat.y, z), f = cat.face, moving = cat.path.length > 0;
  g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.ellipse(x, y, 2.2 * u, 0.9 * u, 0, 0, 7); g.fill();
  g.fillStyle = "#0b0b0d"; g.strokeStyle = "rgba(120,120,130,.5)"; g.lineWidth = Math.max(0.5, u * 0.15);
  if (sleep) { // curled up, tail around, slow breathing
    const b = 1 + Math.sin(t * 2) * 0.04;
    g.beginPath(); g.ellipse(x, y - 1.1 * u, 2 * u * b, 1.2 * u * b, 0, 0, 7); g.fill(); g.stroke();
    g.beginPath(); g.arc(x + 1.3 * u * f, y - 1.6 * u, 0.9 * u, 0, 7); g.fill();
    g.strokeStyle = "#0b0b0d"; g.lineWidth = u * 0.6; g.beginPath(); g.arc(x, y - 1 * u, 2 * u, 0.3, 2.6); g.stroke();
    g.fillStyle = "#d8d4cc"; g.font = `${T * 0.22}px serif`; g.fillText("z", x - 1.6 * u * f + (t % 2) * u, y - 3 * u - (t % 2) * u * 2);
  } else {
    const eat = cat.state === "eat", step = moving ? Math.sin(cat.walk) * 0.5 * u : 0;
    g.lineWidth = u * 0.45; g.strokeStyle = "#0b0b0d";
    for (const [lx, s] of [[-1.1, 1], [-0.6, -1], [0.7, -1], [1.2, 1]]) { g.beginPath(); g.moveTo(x + lx * u * f, y - 1.4 * u); g.lineTo(x + lx * u * f + step * s, y); g.stroke(); } // legs
    g.beginPath(); g.ellipse(x, y - 1.8 * u, 1.9 * u, 0.9 * u, 0, 0, 7); g.fill(); // body
    g.lineWidth = u * 0.5; g.beginPath(); g.moveTo(x - 1.7 * u * f, y - 2 * u); // tail, swaying
    g.quadraticCurveTo(x - 3 * u * f, y - 2.5 * u, x - 2.6 * u * f + Math.sin(t * 2.5) * u, y - 4.3 * u); g.stroke();
    const hx = x + 1.9 * u * f, hy = y - (eat ? 1.2 : 2.8) * u;
    g.beginPath(); g.arc(hx, hy, 0.95 * u, 0, 7); g.fill(); // head
    g.beginPath(); g.moveTo(hx - 0.8 * u, hy - 0.4 * u); g.lineTo(hx - 0.55 * u, hy - 1.6 * u); g.lineTo(hx - 0.05 * u, hy - 0.7 * u);
    g.moveTo(hx + 0.8 * u, hy - 0.4 * u); g.lineTo(hx + 0.55 * u, hy - 1.6 * u); g.lineTo(hx + 0.05 * u, hy - 0.7 * u); g.fill(); // ears
    if (cat.paw) { g.strokeStyle = "#0b0b0d"; g.lineWidth = u * 0.45; g.beginPath(); g.moveTo(hx - 0.3 * u * f, hy + 0.8 * u); g.lineTo(hx + 1.6 * u * f, hy - 0.2 * u); g.stroke(); g.fillStyle = "#0b0b0d"; } // swiping paw
    if (!eat && Math.sin(t * 0.7) < 0.97) { g.fillStyle = "#d4e04a"; g.beginPath(); g.arc(hx - 0.35 * u + 0.15 * u * f, hy - 0.1 * u, 0.22 * u, 0, 7); g.arc(hx + 0.35 * u + 0.15 * u * f, hy - 0.1 * u, 0.22 * u, 0, 7); g.fill(); } // glowing eyes (they blink)
  }
  cat.top = y - 4.5 * u;
  cat.box = [x - 3 * u, y - 4.5 * u, x + 3 * u, y + u];
}

// ---------- comedy ----------
// BD-1 answers Dex on its green screen, deadpan
const DIALOGS = [
  ["BD-1, você acha que eu sou um fracasso?", "> ANALISANDO... RESPOSTA: SIM."],
  ["BD-1, quanto eu tenho no banco?", "> SALDO INSUFICIENTE PARA ESSA PERGUNTA."],
  ["BD-1, me conta uma piada.", "> SUA CONTA DE LUZ."],
  ["Você sonha, BD-1?", "> SONHO COM UM USUÁRIO MAIS COMPETENTE."],
  ["BD-1, de onde você veio?", "> ACESSO NEGADO :)"],
  ["BD-1, a Lena vai voltar?", "> ...MUDANDO DE ASSUNTO. O BDC SUBIU."],
  ["Bom dia, BD-1.", "> SÃO {HORA}. NÃO É DIA. NÃO É BOM."],
];
let bd1 = { text: "", at: 0, until: 0 };
function askBD1() {
  const [q, a0] = pick(DIALOGS);
  const a = S.poo && Math.random() < 0.4 ? tr("> ALERTA: DESCARGA PENDENTE NO BANHEIRO.") : tr(a0, { HORA: nyc().toTimeString().slice(0, 5) });
  bd1 = { text: a, at: Date.now() + 1800, until: Date.now() + 6500 };
  return q;
}
function termBubble(text, x, y) {
  g.font = "13px VT323, monospace"; const w = Math.min(g.measureText(text).width + 14, CW - 12), h = 20;
  const bx = Math.max(6, Math.min(x - w / 2, CW - w - 6)), by = Math.max(4, y - h - 6);
  g.fillStyle = "rgba(5,12,7,.95)"; g.strokeStyle = "#39d98a"; g.lineWidth = 1; g.beginPath(); g.roundRect(bx, by, w, h, 2); g.fill(); g.stroke();
  g.fillStyle = "#39d98a"; g.fillText(text, bx + 7, by + 14);
}

// a cockroach scuttles across the floor at night (or when the place is filthy); tap it for a slipper strike
let roach = null, splat = null, shakeUntil = 0;
function updateRoach(dt) {
  if (!roach && (dayPhase() !== "day" || S.trash.length >= 3) && Math.random() < dt / 90) {
    const r = pick(ROOMS); roach = { x: r.x0 + 0.5 + Math.random() * (r.x1 - r.x0 - 1), y: r.y0 + 0.5 + Math.random() * (r.y1 - r.y0 - 1), a: Math.random() * 7, v: 1.3, until: Date.now() + 9000 };
  }
  if (!roach) return;
  roach.a += (Math.random() - 0.5) * dt * 8;
  roach.x += Math.cos(roach.a) * roach.v * dt; roach.y += Math.sin(roach.a) * roach.v * dt;
  if (roach.x < 0.3 || roach.y < 0.3 || roach.x > W - 0.3 || roach.y > D - 0.3) { roach.a += Math.PI; roach.x = Math.max(0.3, Math.min(W - 0.3, roach.x)); roach.y = Math.max(0.3, Math.min(D - 0.3, roach.y)); }
  if (Date.now() > roach.until) roach = null;
}
function drawRoach() {
  if (splat && Date.now() < splat.until) { const [x, y] = P(splat.x, splat.y, 0.01); g.fillStyle = "#3a2410"; g.beginPath(); g.ellipse(x, y, T * 0.12, T * 0.05, 0.3, 0, 7); g.fill(); g.beginPath(); g.ellipse(x + T * 0.1, y - T * 0.03, T * 0.04, T * 0.02, 0, 0, 7); g.fill(); }
  if (!roach) return;
  const [x, y] = P(roach.x, roach.y, 0.02), [x2, y2] = P(roach.x + Math.cos(roach.a), roach.y + Math.sin(roach.a), 0.02), t = Date.now() / 40;
  g.save(); g.translate(x, y); g.rotate(Math.atan2(y2 - y, x2 - x));
  g.strokeStyle = "#2a1608"; g.lineWidth = 1;
  for (const s of [-1, 1]) for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(i * T * 0.04, 0); g.lineTo(i * T * 0.05 + Math.sin(t + i) * T * 0.015, s * T * 0.06); g.stroke(); } // legs
  g.beginPath(); g.moveTo(T * 0.08, 0); g.lineTo(T * 0.16, -T * 0.04); g.moveTo(T * 0.08, 0); g.lineTo(T * 0.16, T * 0.04); g.stroke(); // antennae
  g.fillStyle = "#5a3416"; g.beginPath(); g.ellipse(0, 0, T * 0.08, T * 0.045, 0, 0, 7); g.fill();
  g.fillStyle = "#3a2410"; g.beginPath(); g.arc(T * 0.075, 0, T * 0.025, 0, 7); g.fill();
  g.restore();
}
function hitRoach(x, y) {
  if (!roach) return false;
  const [rx, ry] = P(roach.x, roach.y, 0.02); if (Math.hypot(rx - x, ry - y) > T * 0.4 + 18 / view.z) return false;
  toast("CHINELADA!"); shakeUntil = Date.now() + 250;
  if (Math.random() < 0.35) { splat = { x: roach.x, y: roach.y, until: Date.now() + 8000 }; roach = null; say(pick(["Pegou! ...que nojo.", "Descanse em paz. Ou não."])); }
  else { roach.a += Math.PI; roach.v = 2.6; say(pick(["Errei. Ela riu de mim.", "Essa barata paga aluguel?", "Ela é mais rápida que o meu salário."])); }
  return true;
}

// the neighbour in 4A bangs on the wall when the radio is loud at night; the cat Dex doesn't have knocks things over
setInterval(() => {
  if (gameOver || overlayOpen()) return;
  if (S.radio && OPTS.volume >= 0.7 && dayPhase() !== "day" && Math.random() < 0.3) {
    shakeUntil = Date.now() + 700; toast("TUM! TUM! TUM!");
    say(pick(["O vizinho do 4A de novo. Com o cabo da vassoura.", "Tá bom, tá bom! Abaixa o rádio, Dex."]));
  }
}, 60000);

// ---------- loop ----------
let last = performance.now();
function frame(t) {
  const dt = Math.min((t - last) / 1000, 0.1); last = t;
  if (!dogVisible() && Math.random() < dt / 240) dogUntil = Date.now() + 25000;
  if (S.radio) S.needs.diversao = clamp100(S.needs.diversao + 0.03 * dt);
  updateDex(dt); updateRoach(dt); updateCat(dt); catTipTick(dt); updateFalling(Date.now());
  const fade = updateCam(dt), m = viewM();
  if (Date.now() < shakeUntil) { m[4] += (Math.random() - 0.5) * 8 * DPR; m[5] += (Math.random() - 0.5) * 8 * DPR; } // screen shake
  g.setTransform(DPR, 0, 0, DPR, 0, 0); g.fillStyle = "#050507"; g.fillRect(0, 0, CW, CH);
  g.setTransform(...m);
  drawRoom();
  const items = O.filter(o => o.boxes && isLive(o)).map(o => { const bs = o.boxes(); return bs.length && { depth: depthOf(bs), draw: () => drawObj(o, bs) }; }).filter(Boolean);
  for (const b of WALL_PIECES) items.push({ depth: b.x + b.w / 2 + b.y + b.d / 2, draw: () => { box(b); poly([P(b.x, b.y, IH), P(b.x + b.w, b.y, IH), P(b.x + b.w, b.y + b.d, IH), P(b.x, b.y + b.d, IH)], "#1c1c21"); } });
  items.push({ depth: dex.x + dex.y + (dex.sit ? 0.1 : 0), draw: drawDex });
  items.push({ depth: cat.x + cat.y + ((cat.state === "sleep" && cat.napZ) || cat.z > 0.05 ? 0.6 : 0), draw: drawCat });
  if (falling && falling.pos) items.push({ depth: falling.pos[0] + falling.pos[1] + 0.8, draw: () => drawTrashAt(falling.i, ...falling.pos) });
  items.sort((a, b) => a.depth - b.depth).forEach(i => i.draw());
  drawDarkness(m);
  g.setTransform(...m); glows(); drawRoach();
  if (hover && !camAnim) drawHighlight(hover, false);
  if (tapFlash && Date.now() < tapFlash.until) drawHighlight(tapFlash.tg, true);
  for (let i = marks.length - 1; i >= 0; i--) { const k = marks[i]; k.t += dt; if (k.t > 0.6) { marks.splice(i, 1); continue; } g.strokeStyle = `rgba(224,38,46,${1 - k.t / 0.6})`; g.lineWidth = 2 / view.z; g.beginPath(); g.ellipse(k.x, k.y, T * 0.3 * (1 + k.t), T * 0.15 * (1 + k.t), 0, 0, 7); g.stroke(); }
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (dex.say && Date.now() < dex.sayUntil && !camAnim) { const [hx, hy] = toScreen(P(dex.x, dex.y)[0], dex.top); bubble(dex.say, hx, hy); }
  if (cat.say && Date.now() < cat.sayUntil && !camAnim) bubble(cat.say, ...toScreen(P(cat.x, cat.y)[0], cat.top));
  for (let i = heartFx.length - 1; i >= 0; i--) {
    const h = heartFx[i]; h.t += dt; if (h.t > 1.4) { heartFx.splice(i, 1); continue; } if (h.t < 0) continue;
    const [hx, hy] = toScreen(...P(cat.x + h.dx, cat.y, 0.4 + h.t * 0.9));
    g.globalAlpha = 1 - h.t / 1.4; g.fillStyle = "#e0262e"; g.font = `${12 + h.t * 6}px serif`; g.fillText("♥", hx, hy); g.globalAlpha = 1;
  }
  if (Date.now() > bd1.at && Date.now() < bd1.until && !camAnim) { const [px, py] = P(4.7, 0.4, owns("desk") ? 1.55 : 1.35); termBubble(bd1.text, ...toScreen(px, py)); }
  for (let i = floats.length - 1; i >= 0; i--) {
    const f = floats[i]; f.t += dt; if (f.t > 1.6) { floats.splice(i, 1); continue; }
    g.globalAlpha = Math.min(1, 2 - f.t * 1.25); g.fillStyle = "#e0262e"; g.font = "700 16px 'Special Elite', serif"; g.textAlign = "center";
    g.fillText(f.text, CW / 2, 40 - f.t * 12); g.textAlign = "left"; g.globalAlpha = 1;
  }
  if (fade) { g.fillStyle = `rgba(0,0,0,${fade})`; g.fillRect(0, 0, CW, CH); }
  requestAnimationFrame(frame);
}
addEventListener("resize", resize); resize();
if (awayDays >= 1 && !gameOver) setTimeout(() => say(tr(awayDays >= 4 ? "{d} dias. Não me deixa sozinho assim de novo." : "Sumiu por {d} dia(s). Achei que tinha me esquecido.", { d: awayDays }), 6000), 1500);
requestAnimationFrame(frame);
