import { SKINS, lift, shade } from "./look.js";

// Draws Dex (legs, arms, torso, clothes, head, hair, hat) onto any 2D context, from a look (see look.js). Used by the game and by the creator preview.
// c: context, x: centre, base: feet line, u: pixel unit (T / 10). o: { look, front, sit, swing, nude, now, bat }. Returns the new base (the hips line).
export function figure(c, x, base, u, o) {
  const L = o.look, { front, sit, swing, nude, now } = o, OUT = "rgba(0,0,0,.5)", lw = Math.max(1, u * 0.25);
  const tw = [2.3, 2.15, 2.0][L.body], fw = [1.7, 1.65, 1.58][L.body]; // half widths of torso and face, in u
  const SKIN = SKINS[L.skin], SKIN_D = shade(SKIN, 0.82), SKIN_L = lift(SKIN, 13);
  const TOP = L.topCol, TOP_D = shade(TOP, 0.47), TOP_L = lift(TOP, 23), BOT = L.botCol, BOT_D = shade(BOT, 0.83), HAIR = L.hairCol;
  const bareLegs = nude || L.bottom >= 2;
  if (!sit) {
    const sw = swing * u * 0.8, ly = base - 4.5 * u;
    for (const [lx, lf, left] of [[x - 1.7 * u, Math.max(0, sw), true], [x + 0.3 * u, Math.max(0, -sw), false]]) {
      const h = 4.5 * u - lf, fy = base - lf;
      c.fillStyle = bareLegs ? (left ? SKIN : SKIN_D) : (left ? BOT : BOT_D); c.fillRect(lx, ly, 1.4 * u, h);
      if (nude) continue;
      if (L.bottom === 0) { // pyjama: polka dots and a frayed cuff
        c.fillStyle = "#ffe14d"; for (let i = 0; i < 4; i++) for (const k of [0.35, 1.0]) if ((i + (k > 0.5)) % 2 === 0) { c.beginPath(); c.arc(lx + k * u, ly + (0.7 + i * 1.0) * u, 0.2 * u, 0, 7); c.fill(); }
        c.fillStyle = "#fff"; c.fillRect(lx, fy - 1.15 * u, 1.4 * u, 0.4 * u);
      } else if (L.bottom === 1) { c.fillStyle = shade(BOT, 0.7); c.fillRect(lx, fy - 1.0 * u, 1.4 * u, 0.3 * u); }
      else if (L.bottom === 2) { c.fillStyle = left ? BOT : BOT_D; c.fillRect(lx - 0.1 * u, ly, 1.6 * u, 2.0 * u); }
      const S2 = L.shoeCol;
      if (L.shoes === 2) { c.fillStyle = S2; c.fillRect(lx - 0.05 * u, fy - 1.6 * u, 1.5 * u, 1.6 * u); c.fillStyle = "#111"; c.fillRect(lx - 0.1 * u, fy - 0.25 * u, 1.7 * u, 0.25 * u); } // boot
      else if (L.shoes === 1) { c.fillStyle = S2; c.beginPath(); c.roundRect(lx - 0.25 * u, fy - 0.85 * u, 1.9 * u, 0.85 * u, 0.4 * u); c.fill(); c.fillStyle = "#eee"; c.fillRect(lx - 0.2 * u, fy - 0.22 * u, 1.8 * u, 0.22 * u); } // sneaker
      else {
        c.fillStyle = S2; c.beginPath(); c.roundRect(lx - 0.25 * u, fy - 0.85 * u, 1.9 * u, 0.85 * u, 0.4 * u); c.fill(); // fuzzy slipper
        c.fillStyle = "#111"; c.fillRect(lx + 0.3 * u, fy - 0.55 * u, 0.2 * u, 0.2 * u); c.fillRect(lx + 0.9 * u, fy - 0.55 * u, 0.2 * u, 0.2 * u);
      }
    }
    if (!nude && L.bottom === 3) { // skirt
      c.fillStyle = BOT; c.beginPath(); c.moveTo(x - (tw - 0.2) * u, ly - 0.1 * u); c.lineTo(x + (tw - 0.2) * u, ly - 0.1 * u); c.lineTo(x + (tw + 0.5) * u, ly + 2.4 * u); c.lineTo(x - (tw + 0.5) * u, ly + 2.4 * u); c.closePath(); c.fill(); c.strokeStyle = OUT; c.lineWidth = lw; c.stroke();
    }
    base -= 4.5 * u;
  }
  const bat = o.bat && { hx: x, hy: base - 2.4 * u, a: -0.55, L: 6.6 * u }; // shower: he faces the wall, so only the bat's barrel pokes out past his side
  if (bat) {
    c.save(); c.translate(bat.hx, bat.hy); c.rotate(bat.a); const B = bat.L;
    c.fillStyle = "#b98a52"; c.beginPath(); c.moveTo(0, -0.25 * u); c.lineTo(B * 0.6, -0.35 * u); c.lineTo(B * 0.62, -0.75 * u); c.lineTo(B, -0.8 * u); c.lineTo(B, 0.8 * u); c.lineTo(B * 0.62, 0.75 * u); c.lineTo(B * 0.6, 0.35 * u); c.lineTo(0, 0.25 * u); c.closePath(); c.fill();
    c.restore();
  }
  // torso shaded from the window side (left) to the room side (right)
  const tx0 = x - tw * u, tx1 = x + tw * u, ty0 = base - 5 * u, ty1 = base + 0.2 * u;
  const sh = c.createLinearGradient(tx0, 0, tx1, 0);
  if (nude) { sh.addColorStop(0, SKIN_L); sh.addColorStop(1, SKIN_D); } else { sh.addColorStop(0, TOP_L); sh.addColorStop(0.45, TOP); sh.addColorStop(1, TOP_D); }
  const torso = () => { c.beginPath(); c.moveTo(tx0 + 0.3 * u, ty0); c.lineTo(tx1 - 0.3 * u, ty0); c.quadraticCurveTo(tx1, ty0, tx1, ty0 + 0.6 * u); c.lineTo(tx1 - 0.1 * u, ty1 - 0.4 * u); c.quadraticCurveTo(tx1 - 0.1 * u, ty1, tx1 - 0.6 * u, ty1); c.lineTo(tx0 + 0.6 * u, ty1); c.quadraticCurveTo(tx0 + 0.1 * u, ty1, tx0 + 0.1 * u, ty1 - 0.4 * u); c.lineTo(tx0, ty0 + 0.6 * u); c.quadraticCurveTo(tx0, ty0, tx0 + 0.3 * u, ty0); c.closePath(); };
  const arm = (ax, k) => {
    const ay = ty0 + 0.3 * u + k * u * 0.5, len = 3.4 * u, sleeve = ax < x ? TOP : TOP_D;
    c.fillStyle = nude || L.top === 2 ? SKIN : sleeve; c.beginPath(); c.roundRect(ax - 0.45 * u, ay, 0.9 * u, len, 0.4 * u); c.fill();
    if (!nude && L.top === 2) { c.fillStyle = sleeve; c.beginPath(); c.roundRect(ax - 0.5 * u, ay, 1.0 * u, 1.2 * u, 0.4 * u); c.fill(); } // t-shirt sleeve
    c.fillStyle = SKIN; c.beginPath(); c.arc(ax, ay + len + 0.15 * u, 0.55 * u, 0, 7); c.fill();
  };
  arm(tx0 - 0.3 * u, swing); arm(tx1 + 0.3 * u, -swing);
  torso(); c.fillStyle = sh; c.fill(); c.strokeStyle = OUT; c.lineWidth = lw; c.stroke();
  if (!nude) {
    const seam = () => { c.strokeStyle = "rgba(0,0,0,.35)"; c.lineWidth = lw; };
    if (front) {
      if (L.top === 0) {
        c.fillStyle = "#d9d5cb"; c.beginPath(); c.moveTo(x - 0.9 * u, ty0); c.lineTo(x + 0.9 * u, ty0); c.lineTo(x, ty0 + 2.1 * u); c.closePath(); c.fill(); // shirt
        c.fillStyle = "#b3141b"; c.beginPath(); c.moveTo(x - 0.28 * u, ty0 + 0.45 * u); c.lineTo(x + 0.28 * u, ty0 + 0.45 * u); c.lineTo(x + 0.4 * u, ty0 + 1.9 * u); c.lineTo(x, ty0 + 2.3 * u); c.lineTo(x - 0.4 * u, ty0 + 1.9 * u); c.closePath(); c.fill(); // tie
        c.fillStyle = TOP_D; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(x + s * 0.9 * u, ty0); c.lineTo(x + s * 1.9 * u, ty0); c.lineTo(x + s * 0.5 * u, ty0 + 2.5 * u); c.lineTo(x, ty0 + 2.1 * u); c.closePath(); c.fill(); } // lapels
        seam(); c.beginPath(); c.moveTo(x, ty0 + 2.3 * u); c.lineTo(x, ty1); c.stroke();
        c.fillStyle = "#0e0e10"; for (const by of [3.3, 4.3]) { c.beginPath(); c.arc(x + 0.45 * u, ty0 + by * u, 0.2 * u, 0, 7); c.fill(); }
        c.fillStyle = "#d9c25a"; c.beginPath(); c.arc(x - 1.2 * u, ty0 + 3.6 * u, 0.3 * u, 0, 7); c.fill(); // mustard stain from yesterday's hot dog
      } else if (L.top === 1) { // hoodie: ring of hood, drawstrings, kangaroo pocket
        c.fillStyle = shade(TOP, 0.8); c.beginPath(); c.ellipse(x, ty0 + 0.2 * u, 1.1 * u, 0.5 * u, 0, 0, 7); c.fill();
        c.beginPath(); c.roundRect(x - 1.3 * u, ty0 + 3.0 * u, 2.6 * u, 1.5 * u, 0.3 * u); c.fill();
        c.strokeStyle = "#ddd"; c.lineWidth = lw; c.beginPath(); c.moveTo(x - 0.4 * u, ty0 + 0.5 * u); c.lineTo(x - 0.4 * u, ty0 + 1.7 * u); c.moveTo(x + 0.4 * u, ty0 + 0.5 * u); c.lineTo(x + 0.4 * u, ty0 + 1.7 * u); c.stroke();
      } else if (L.top === 2) { c.fillStyle = SKIN_D; c.beginPath(); c.arc(x, ty0, 0.8 * u, 0, Math.PI); c.fill(); } // round neckline
      else { // jacket: zip, collar, chest pocket
        c.fillStyle = TOP_L; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(x + s * 0.2 * u, ty0); c.lineTo(x + s * 1.5 * u, ty0); c.lineTo(x + s * 0.4 * u, ty0 + 1.3 * u); c.closePath(); c.fill(); }
        c.strokeStyle = "#bbb"; c.lineWidth = lw; c.beginPath(); c.moveTo(x, ty0 + 0.6 * u); c.lineTo(x, ty1); c.stroke();
        seam(); c.strokeRect(x + 0.7 * u, ty0 + 2.0 * u, 1.0 * u, 0.9 * u);
      }
    } else if (L.top === 0 || L.top === 3) { c.fillStyle = TOP_D; c.fillRect(tx0 + 0.2 * u, ty0, (2 * tw - 0.4) * u, 0.7 * u); seam(); c.beginPath(); c.moveTo(x, ty0 + 0.7 * u); c.lineTo(x, ty1); c.stroke(); } // collar and back seam
    else if (L.top === 1) { c.fillStyle = shade(TOP, 0.8); c.beginPath(); c.ellipse(x, ty0 + 0.4 * u, 1.5 * u, 0.9 * u, 0, 0, 7); c.fill(); } // hood hanging at the back
    if (L.bottom === 0) { c.fillStyle = "#d8a63a"; c.fillRect(tx0 + 0.2 * u, ty1 - 0.25 * u, (2 * tw - 0.4) * u, 0.45 * u); } // pyjama waistband peeking out
  }
  if (bat) { // Sims-style censor pixels over the barrel
    const s = 0.6 * u, cx = bat.hx + Math.cos(bat.a) * bat.L * 0.8, cy = bat.hy + Math.sin(bat.a) * bat.L * 0.8, ox = cx - 2.1 * s, oy = cy - 2.5 * s, rows = ["011110", "111111", "111111", "111111", "011110"];
    rows.forEach((r, j) => [...r].forEach((ch, i) => {
      if (ch === "0") return;
      const v = Math.sin(now / 260 + i * 2.1 + j * 3.7), k = 150 + v * 40 + ((i + j) % 2) * 25; c.fillStyle = `rgba(${k},${k},${k + 6},.8)`; c.fillRect(ox + i * s, oy + j * s, s + 0.4, s + 0.4);
    }));
  }

  // ---- head ----
  const hy = base - 6.9 * u, rx = fw * u, ry = 1.95 * u;
  const cap = (a0, a1) => { c.beginPath(); c.ellipse(x, hy, rx + 0.06 * u, ry + 0.06 * u, 0, a0 * Math.PI, a1 * Math.PI); c.closePath(); c.fill(); }; // hair over the top of the head
  const bumps = () => { for (let a = 1.05; a <= 1.96; a += 0.15) { c.beginPath(); c.arc(x + Math.cos(a * Math.PI) * (fw + 0.1) * u, hy + Math.sin(a * Math.PI) * 2.0 * u, 0.62 * u, 0, 7); c.fill(); } };
  c.fillStyle = HAIR; // hair that sits behind the head
  if (L.hair === 1 || L.hair === 6) { c.beginPath(); c.roundRect(x - (fw + 0.28) * u, hy - 1.2 * u, (2 * fw + 0.56) * u, (L.hair === 1 ? 4.4 : 3.0) * u, 0.9 * u); c.fill(); }
  else if (L.hair === 3) { c.beginPath(); c.ellipse(x, hy - 0.5 * u, (fw + 0.9) * u, 2.9 * u, 0, 0, 7); c.fill(); }
  else if (L.hair === 5) { if (front) { c.beginPath(); c.ellipse(x + (fw + 0.35) * u, hy + 0.7 * u, 0.45 * u, 1.2 * u, 0.2, 0, 7); c.fill(); } else c.fillRect(x - 0.55 * u, hy - 0.5 * u, 1.1 * u, 3.4 * u); }
  c.fillStyle = SKIN_D; c.fillRect(x - 0.65 * u, base - 5.4 * u, 1.3 * u, 0.9 * u); // neck
  c.fillStyle = SKIN; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(x + s * (fw + 0.02) * u, hy + 0.2 * u, 0.32 * u, 0.55 * u, 0, 0, 7); c.fill(); }
  const hg = c.createLinearGradient(x - rx, 0, x + rx, 0); hg.addColorStop(0, SKIN_L); hg.addColorStop(0.55, SKIN); hg.addColorStop(1, SKIN_D);
  c.beginPath(); c.ellipse(x, hy, rx, ry, 0, 0, 7); c.fillStyle = hg; c.fill(); c.strokeStyle = OUT; c.lineWidth = lw; c.stroke();
  if (front) {
    c.save(); c.beginPath(); c.ellipse(x, hy, rx, ry, 0, 0, 7); c.clip();
    if (L.hat === 1) { c.fillStyle = "rgba(0,0,0,.4)"; c.fillRect(x - 2 * u, hy - 2 * u, 4 * u, 1.35 * u); } // shadow thrown by the hat brim
    if (L.beard === 1) { c.fillStyle = "rgba(0,0,0,.14)"; c.beginPath(); c.ellipse(x, hy + 1.5 * u, 1.5 * u, 0.9 * u, 0, 0, 7); c.fill(); } // five o'clock shadow
    if (L.beard === 3) { c.fillStyle = HAIR; c.fillRect(x - 2 * u, hy + 0.75 * u, 4 * u, 2 * u); }
    c.restore();
    if (L.freckles) { c.fillStyle = shade(SKIN, 0.72); for (const [fx, fy] of [[-0.9, 0.35], [-0.6, 0.6], [-0.3, 0.4], [0.3, 0.4], [0.6, 0.6], [0.9, 0.35]]) { c.beginPath(); c.arc(x + fx * u, hy + fy * u, 0.07 * u, 0, 7); c.fill(); } }
    for (const s of [-1, 1]) { // eyes
      const ex = x + s * 0.66 * u, ey = hy - 0.1 * u;
      if (L.eyes === 1) { c.fillStyle = "#f1ede6"; c.beginPath(); c.ellipse(ex, ey, 0.34 * u, 0.3 * u, 0, 0, 7); c.fill(); c.fillStyle = L.eyeCol; c.beginPath(); c.arc(ex, ey, 0.2 * u, 0, 7); c.fill(); }
      else { c.fillStyle = L.eyeCol; c.save(); c.translate(ex, ey); c.rotate(L.eyes === 2 ? -s * 0.22 : 0); c.beginPath(); c.ellipse(0, 0, (L.eyes === 2 ? 0.34 : 0.26) * u, (L.eyes === 2 ? 0.18 : 0.2) * u, 0, 0, 7); c.fill(); c.restore(); }
    }
    c.strokeStyle = shade(HAIR, 0.8); c.lineCap = "round"; // brows
    for (const s of [-1, 1]) {
      c.lineWidth = Math.max(1, u * (L.brows === 1 ? 0.5 : 0.28)); c.beginPath();
      if (L.brows === 2) { c.moveTo(x + s * 1.1 * u, hy - 0.45 * u); c.quadraticCurveTo(x + s * 0.7 * u, hy - 0.85 * u, x + s * 0.3 * u, hy - 0.5 * u); }
      else { c.moveTo(x + s * 1.1 * u, hy - (L.brows ? 0.5 : 0.55) * u); c.lineTo(x + s * 0.3 * u, hy - (L.brows ? 0.45 : 0.4) * u); }
      c.stroke();
    }
    c.lineCap = "butt"; c.strokeStyle = shade(SKIN, 0.55); c.lineWidth = Math.max(1, u * 0.28); c.beginPath(); // nose
    if (L.nose === 1) { c.moveTo(x + 0.05 * u, hy - 0.05 * u); c.lineTo(x - 0.05 * u, hy + 0.45 * u); c.lineTo(x + 0.2 * u, hy + 0.5 * u); }
    else if (L.nose === 2) { c.moveTo(x + 0.05 * u, hy - 0.1 * u); c.lineTo(x - 0.25 * u, hy + 0.6 * u); c.lineTo(x + 0.35 * u, hy + 0.65 * u); }
    else { c.moveTo(x + 0.05 * u, hy - 0.1 * u); c.lineTo(x - 0.15 * u, hy + 0.6 * u); c.lineTo(x + 0.25 * u, hy + 0.65 * u); }
    c.stroke();
    if (L.beard === 2 || L.beard === 3) { c.fillStyle = HAIR; c.beginPath(); c.roundRect(x - 0.8 * u, hy + 0.72 * u, 1.6 * u, 0.38 * u, 0.2 * u); c.fill(); } // moustache
    c.strokeStyle = L.beard === 3 ? "#a8685a" : L.lipCol; c.fillStyle = L.lipCol; c.beginPath(); // mouth
    if (L.mouth === 1) { c.moveTo(x - 0.55 * u, hy + 1.1 * u); c.quadraticCurveTo(x, hy + 1.45 * u, x + 0.55 * u, hy + 1.08 * u); c.stroke(); }
    else if (L.mouth === 2) { c.ellipse(x, hy + 1.18 * u, 0.6 * u, 0.28 * u, 0, 0, 7); c.fill(); }
    else { c.moveTo(x - 0.5 * u, hy + 1.15 * u); c.lineTo(x + 0.5 * u, hy + 1.1 * u); c.stroke(); }
    if (L.glasses) {
      c.strokeStyle = "#111"; c.lineWidth = Math.max(1, u * 0.22); c.beginPath();
      for (const s of [-1, 1]) { const ex = x + s * 0.66 * u, ey = hy - 0.1 * u; if (L.glasses === 1) { c.moveTo(ex + 0.5 * u, ey); c.arc(ex, ey, 0.5 * u, 0, 7); } else c.roundRect(ex - 0.5 * u, ey - 0.38 * u, 1 * u, 0.76 * u, 0.1 * u); c.moveTo(x + s * 1.16 * u, ey); c.lineTo(x + s * (fw - 0.1) * u, ey - 0.05 * u); }
      c.moveTo(x - 0.16 * u, hy - 0.1 * u); c.lineTo(x + 0.16 * u, hy - 0.1 * u); if (o.shades) { c.fillStyle = "#0b0b0d"; c.fill(); } c.stroke(); // o.shades: dark lenses (vacation)
    }
  }
  c.fillStyle = HAIR; // hair on top of the head
  if (!front) {
    if (L.hair !== 4) { c.beginPath(); c.ellipse(x, hy - 0.2 * u, (fw - 0.02) * u, 1.75 * u, 0, 0, 7); c.fill(); c.fillRect(x - 1.3 * u, hy + 1 * u, 2.6 * u, 0.6 * u); }
    if (L.hair === 7) bumps();
    if (L.hair === 2) { c.beginPath(); c.arc(x, hy - 2.3 * u, 0.85 * u, 0, 7); c.fill(); }
  } else if (L.hair === 7) { cap(1.1, 1.9); bumps(); }
  else if (L.hair === 2) { cap(1.1, 1.9); c.beginPath(); c.arc(x, hy - 2.3 * u, 0.85 * u, 0, 7); c.fill(); }
  else if (L.hair === 3) cap(1.15, 1.85);
  else if (L.hair !== 4) cap(L.hair === 0 ? 1.08 : 1.05, L.hair === 0 ? 1.92 : 1.95);
  if (L.hat === 1) { // fedora (it comes off for the shower)
    if (!nude) {
      const hg2 = c.createLinearGradient(x - 1.9 * u, 0, x + 1.9 * u, 0); hg2.addColorStop(0, lift(L.hatCol, 14)); hg2.addColorStop(1, shade(L.hatCol, 0.55));
      c.fillStyle = hg2; c.beginPath(); c.roundRect(x - 1.9 * u, base - 10.2 * u, 3.8 * u, 2 * u, [0.8 * u, 0.8 * u, 0.1 * u, 0.1 * u]); c.fill(); // crown
      c.fillStyle = "rgba(0,0,0,.5)"; c.fillRect(x - 0.12 * u, base - 10.2 * u, 0.24 * u, 1.2 * u); // the crown's pinch
      c.fillStyle = "#5c0f15"; c.fillRect(x - 1.9 * u, base - 9.2 * u, 3.8 * u, 0.55 * u); // hat band
      c.fillStyle = shade(L.hatCol, 0.72); c.beginPath(); c.ellipse(x, base - 8.45 * u, 3.3 * u, 0.85 * u, 0, 0, 7); c.fill(); c.strokeStyle = OUT; c.lineWidth = lw; c.stroke(); // brim
      c.strokeStyle = "rgba(255,255,255,.12)"; c.beginPath(); c.ellipse(x, base - 8.55 * u, 3.1 * u, 0.7 * u, 0, Math.PI * 1.05, Math.PI * 1.7); c.stroke();
    }
  } else if (L.hat === 2 && !nude) { // beret
    c.fillStyle = L.hatCol; c.beginPath(); c.ellipse(x + 0.35 * u, base - 8.9 * u, 2.6 * u, 0.95 * u, -0.08, 0, 7); c.fill(); c.strokeStyle = OUT; c.lineWidth = lw; c.stroke(); c.fillRect(x + 0.2 * u, base - 10.0 * u, 0.35 * u, 0.4 * u);
  } else if (L.hat === 4 && !nude) { // straw hat: wide brim, rounded crown, colour band
    c.fillStyle = "#d9b45a"; c.beginPath(); c.ellipse(x, base - 8.5 * u, 3.5 * u, 0.9 * u, 0, 0, 7); c.fill(); c.strokeStyle = OUT; c.lineWidth = lw; c.stroke();
    c.beginPath(); c.roundRect(x - 1.5 * u, base - 10.4 * u, 3.0 * u, 2.1 * u, [1.3 * u, 1.3 * u, 0.1 * u, 0.1 * u]); c.fill(); c.stroke();
    c.fillStyle = L.hatCol; c.fillRect(x - 1.5 * u, base - 9.1 * u, 3.0 * u, 0.5 * u);
  } else if (L.hat === 3 && !nude) { // beanie
    c.fillStyle = L.hatCol; c.beginPath(); c.roundRect(x - 1.85 * u, base - 10.1 * u, 3.7 * u, 1.8 * u, [1.2 * u, 1.2 * u, 0.1 * u, 0.1 * u]); c.fill(); c.strokeStyle = OUT; c.lineWidth = lw; c.stroke();
    c.fillStyle = shade(L.hatCol, 0.75); c.fillRect(x - 1.9 * u, base - 8.8 * u, 3.8 * u, 0.7 * u); c.fillStyle = lift(L.hatCol, 30); c.beginPath(); c.arc(x, base - 10.3 * u, 0.5 * u, 0, 7); c.fill();
  }
  return base;
}
