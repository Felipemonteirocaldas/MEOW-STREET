const LINES = {
  // BDC is pegged to real BTC (≈ $0.80 each), so mining is slow on purpose: a level pays itself back in ~8-12 min
  hardware: { name: "Hardware", cost: 2,   prod: 0.004 },
  software: { name: "Software", cost: 15,  prod: 0.03 },
  dados:    { name: "Dados",    cost: 150, prod: 0.2 },
};
const OFFLINE_CAP_S = 8 * 3600, DAY = 86400000, DEATH_DAYS = 7, EGG_TOTAL = 10;
for (const k in LINES) LINES[k].name = tr(LINES[k].name); // LANG/tr come from lang.js; news use native-language portals too
const SAVE_KEY = "bd2"; // v2: the run starts in an empty apartment (old "bd" saves are left alone)
const hasSave = (() => { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } })();
// shortcut: uses device clock; swap for server time before launch (anti-cheat).
const now = () => Date.now();

let S = load();
function load() {
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s) return s; } catch (e) {}
  return { cycles: 0, last: now(), levels: { hardware: 0, software: 0, dados: 0 }, mods: {}, claimed: {} };
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// defaults for systems added after a save was created
S.needs = Object.assign({ fome: 80, energia: 80, diversao: 70, higiene: 80 }, S.needs);
S.furn = Object.assign({ pc: 0, cama: 0, geladeira: 0, tv: 0 }, S.furn);
S.trash = S.trash || [];
S.bills = S.bills || [];
S.eggs = S.eggs || {};
S.lastBill = S.lastBill || now() - DAY; // first bills arrive on day one
S.lastTrash = S.lastTrash || now();
S.lastSeen = S.lastSeen || now();
// Two currencies: BD-1 mines BDC (S.cycles); the real world (bills, furniture) wants dollars.
if (S.usd === undefined) S.usd = 50;
S.price = S.price || 0.5; // dollars per BDC
S.hist = S.hist || [];
if (S.doorLocked === undefined) S.doorLocked = true;
if (S.modsLang !== LANG) { S.mods = {}; S.modsLang = LANG; } // headlines from another language don't carry over
S.cat = Object.assign({ aff: 10, hunger: 70, bowl: 0 }, S.cat); // Sombra, the black cat: affection, hunger, food in the bowl

// Dex can't be left alone too long: a week without the player ends the run.
const awayMs = now() - S.lastSeen, awayDays = Math.floor(awayMs / DAY), gameOver = awayMs > DEATH_DAYS * DAY;
const save = () => { if (gameOver) return; S.lastSeen = now(); try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} };
S.started = S.started || now();

// ---------- owned furniture: the run starts with a mattress, BD-1 on crates, a pocket radio and a basic kitchen/bathroom ----------
S.own = S.own || [];
S.bought = S.bought || {};
const owns = k => S.own.includes(k);
// catalog sorted by room, like The Sims' buy mode
const CATALOG = [
  { key: "desk", room: "Sala", name: "Escrivaninha com luminária", price: 80, desc: "Tira o BD-1 dos caixotes." },
  { key: "deskchair", room: "Sala", name: "Cadeira de trabalho", price: 30, desc: "O Dex para de trabalhar no chão." },
  { key: "tv", room: "Sala", name: "TV de tubo 14\"", price: 120, desc: "Ânimo e comerciais com bônus." },
  { key: "sofa", room: "Sala", name: "Sofá chesterfield", price: 150, desc: "Descanso, e lugar para ver TV." },
  { key: "armchair", room: "Sala", name: "Poltrona de couro", price: 90, desc: "Leitura: ânimo +10." },
  { key: "coffee", room: "Sala", name: "Mesa de centro", price: 40, desc: "Decoração." },
  { key: "rug", room: "Sala", name: "Tapete persa", price: 25, desc: "Decoração." },
  { key: "shelf", room: "Sala", name: "Estante de livros", price: 70, desc: "Livros. E talvez algo mais." },
  { key: "lamp", room: "Sala", name: "Abajur de pé", price: 35, desc: "Luz quente na sala." },
  { key: "records", room: "Sala", name: "Vitrola Hi-Fi", price: 220, desc: "Substitui o rádio de pilha." },
  { key: "clock", room: "Sala", name: "Relógio de parede", price: 20, desc: "Hora de Nova York." },
  { key: "cork", room: "Sala", name: "Mural de cortiça", price: 15, desc: "Para ligar os pontos." },
  { key: "ktable", room: "Cozinha", name: "Mesa e cadeira", price: 60, desc: "Ler o jornal com calma." },
  { key: "counter", room: "Cozinha", name: "Balcão com cafeteira", price: 45, desc: "Café: energia +8." },
  { key: "bed", room: "Quarto", name: "Cama", price: 160, desc: "Dorme mais rápido que no colchão." },
  { key: "nightstand", room: "Quarto", name: "Criado-mudo com despertador", price: 30, desc: "Luz de cabeceira." },
  { key: "wardrobe", room: "Quarto", name: "Guarda-roupa", price: 110, desc: "O que tem lá dentro?" },
  { key: "tub", room: "Banheiro", name: "Banheira de pés", price: 140, desc: "Higiene +60 de uma vez." },
  { key: "ticker", room: "Escritório", name: "Máquina de cotações", price: 200, desc: "A bolsa ao vivo, no escritório." },
  { key: "cabinets", room: "Escritório", name: "Arquivos de aço", price: 60, desc: "Crescem com a linha de Dados." },
  { key: "floppies", room: "Escritório", name: "Mesa de disquetes", price: 45, desc: "Crescem com o Software." },
  { key: "safe", room: "Escritório", name: "Cofre", price: 250, desc: "Pesado. Misterioso." },
];
for (const c of CATALOG) { c.name = tr(c.name); c.desc = tr(c.desc); c.room = tr(c.room); }
const catItem = k => CATALOG.find(c => c.key === k);
// The Sims-style depreciation: 25% off as soon as it's yours, then 5% a day, down to 40% of the price
function sellValue(k) {
  const c = catItem(k), days = (now() - (S.bought[k] || now())) / DAY;
  return Math.round(c.price * Math.max(0.4, 0.75 - 0.05 * days));
}
function buyItem(k) {
  const c = catItem(k);
  if (!c || owns(k) || S.usd < c.price) return false;
  S.usd -= c.price; S.own.push(k); S.bought[k] = now(); save();
  if (typeof bounce === "function") bounce(k);
  return true;
}
function sellItem(k) {
  if (!owns(k)) return 0;
  const v = sellValue(k); S.usd += v; S.own = S.own.filter(x => x !== k); delete S.bought[k];
  if (k === "tv") S.furn.tv = 0; if (k === "bed") S.furn.cama = 0;
  save(); return v;
}

// Furniture upgrades bought with cycles in the catalog; each tier changes the look in scene.js and an effect here.
const FURN_UP = {
  pc:        { name: "Computador", tiers: ["BD-1 bege", "BD-2 com modem", "Workstation preta"], cost: [0, 400, 6000], fx: ["Hardware ×1", "Hardware ×1,5", "Hardware ×2,2"] },
  cama:      { name: "Cama", tiers: ["Cama simples", "Cama de casal", "Cama d'água"], cost: [0, 250, 3000], fx: ["Sono +5/s", "Sono +9/s", "Sono +15/s"] },
  geladeira: { name: "Geladeira", tiers: ["Usada, cor creme", "Frost-free", "Duplex cromada"], cost: [0, 150, 2000], fx: ["Refeição +40", "Refeição +60", "Refeição +90"] },
  tv:        { name: "TV", tiers: ["Tubo 14\" de madeira", "20\" com videocassete", "Console 29\" cromado"], cost: [0, 300, 4000], fx: ["Ânimo +25", "Ânimo +40, anúncio +0,5×", "Ânimo +60, anúncio +1×"] },
};
for (const f of Object.values(FURN_UP)) { f.name = tr(f.name); f.tiers = f.tiers.map(x => tr(x)); f.fx = f.fx.map(x => tr(x)); }
const PC_MULT = [1, 1.5, 2.2], SLEEP_RATE = [5, 9, 15], MEAL = [40, 60, 90], TV_FUN = [25, 40, 60], AD_EXTRA = [0, 0.5, 1];
function buyFurn(k) {
  const c = FURN_UP[k].cost[S.furn[k] + 1];
  if (c === undefined || S.usd < c) return false;
  S.usd -= c; S.furn[k]++; save(); if (typeof bounce === "function") bounce(k);
  return true;
}

// The apartment is in New York: clocks and light follow NYC time. ?t=day|dusk|night overrides it for previewing.
const nyc = () => new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
function dayPhase() {
  const o = new URLSearchParams(location.search).get("t"); if (o) return o;
  const d = nyc(), h = d.getHours() + d.getMinutes() / 60;
  return h >= 7 && h < 17 ? "day" : (h >= 17 && h < 19.5) || (h >= 5.5 && h < 7) ? "dusk" : "night";
}

// ---------- bills: arrive daily under the door; overdue light bill cuts the power ----------
const powerCut = () => S.bills.some(b => b.kind === "Luz" && now() > b.due);
const rentLate = () => S.bills.some(b => b.kind === "Aluguel" && now() > b.due);
function billsTick() {
  while (now() - S.lastBill >= DAY) {
    S.lastBill += DAY; S.billN = (S.billN || 0) + 1;
    const r = totalRate() * S.price, due = S.lastBill + 3 * DAY; // dollars per second the operation is worth
    S.bills.push({ id: S.lastBill + 1, kind: "Luz", amount: Math.round(4 + r * 240 * (1 + S.furn.pc * 0.5 + S.levels.hardware * 0.02)), due });
    S.bills.push({ id: S.lastBill + 2, kind: "Telefone", amount: Math.round(2 + r * 90), due });
    if (S.billN % 7 === 1) S.bills.push({ id: S.lastBill + 3, kind: "Aluguel", amount: Math.round(25 + r * 1500), due });
  }
}
function payBill(id) {
  const b = S.bills.find(x => x.id === id);
  if (!b || S.usd < b.amount) return false;
  S.usd -= b.amount; S.bills = S.bills.filter(x => x !== b); save();
  return true;
}

// ---------- BDC market: the price is real BTC/USD ÷ 100,000, delivered by the server in worldstate.json ----------
const FEE = 0.03;
// Trading always costs a fee: churn loses money.
function sellBDC(bdc) { bdc = Math.min(bdc, S.cycles); if (bdc <= 0) return 0; S.cycles -= bdc; const usd = bdc * S.price * (1 - FEE); S.usd += usd; save(); return usd; }
function buyBDC(usd) { usd = Math.min(usd, S.usd); if (usd <= 0) return 0; S.usd -= usd; const bdc = usd / S.price * (1 - FEE); S.cycles += bdc; save(); return bdc; }
const fmtUSD = n => "$" + (n < 1000 ? n.toFixed(2) : fmt(n));

// ---------- mess: a piece of trash shows up every 15 min (spot indices map to places in scene.js) ----------
const TRASH_N = 14, TRASH_EVERY = 15 * 60000;
function trashTick() {
  while (now() - S.lastTrash >= TRASH_EVERY) {
    S.lastTrash += TRASH_EVERY;
    const free = [...Array(TRASH_N).keys()].filter(i => !S.trash.includes(i));
    if (free.length && S.trash.length < 10) S.trash.push(free[Math.floor(Math.random() * free.length)]);
  }
}

// ---------- needs: they scale production (0.85..1.25) ----------
const DECAY = { fome: 0.02, energia: 0.013, diversao: 0.017, higiene: 0.012 }; // points per second
function decayNeeds(sec, floor = 0) {
  for (const k in DECAY) {
    const m = k === "diversao" ? (1 + (S.trash.length + (S.poo ? 3 : 0)) / 6) * (rentLate() ? 2 : 1) : 1; // mess (and an unflushed toilet) and late rent wear him down
    S.needs[k] = Math.max(Math.min(S.needs[k], floor), S.needs[k] - DECAY[k] * m * sec);
  }
}
const needsMult = () => 0.85 + 0.4 * (S.needs.fome + S.needs.energia + S.needs.diversao + S.needs.higiene) / 400;
function renderNeeds() {
  const bar = (k, label) => `<div class="need"><span>${label}</span><i><b style="width:${S.needs[k]}%;${S.needs[k] < 30 ? "background:var(--bad)" : ""}"></b></i></div>`;
  const alerts = [];
  if (powerCut()) alerts.push(tr("⚡ Luz cortada: pague a conta na porta"));
  else if (S.bills.length) alerts.push(tr("✉ {n} conta(s) na porta", { n: S.bills.length }));
  if (S.trash.length >= 6) alerts.push(tr("🗑 Apartamento imundo"));
  document.getElementById("needs").innerHTML = bar("fome", tr("Comida")) + bar("energia", tr("Energia")) + bar("diversao", tr("Ânimo")) + bar("higiene", tr("Higiene"))
    + `<div class="sub">${tr("Disposição ×{x} · Sombra {h}{hungry} · Pistas {n}/{t}{alerts}", { x: needsMult().toFixed(2), h: "♥".repeat(Math.max(1, Math.ceil(S.cat.aff / 20))),
      hungry: S.cat.hunger < 25 ? tr(" (com fome)") : "", n: Object.keys(S.eggs).length, t: EGG_TOTAL, alerts: alerts.length ? " · " + alerts.join(" · ") : "" })}</div>`;
}

// mods: id -> {line, mult, until, headline, faction, sponsored?, advertiser?, reward?}
const activeMods = () => Object.values(S.mods).filter(m => m.until > now());
const lineMult = l => activeMods().filter(m => m.line === l).reduce((a, m) => a * m.mult, 1)
  * (S.bonus && S.bonus.until > now() && S.bonus.line === l ? S.bonus.mult : 1) * needsMult()
  * (l === "hardware" ? PC_MULT[S.furn.pc] : 1) * (powerCut() ? 0.3 : 1);
const lineRate = l => LINES[l].prod * S.levels[l] * lineMult(l);
const totalRate = () => Object.keys(LINES).reduce((a, l) => a + lineRate(l), 0);
const cost = l => Math.ceil(LINES[l].cost * Math.pow(1.15, S.levels[l]));
const fmt = n => n < 1e3 ? n.toFixed(n < 1 ? 3 : n < 10 ? 2 : n < 100 ? 1 : 0) : n < 1e6 ? (n / 1e3).toFixed(2) + "K" : (n / 1e6).toFixed(2) + "M";

// offline progress (simple: current rate over elapsed time, capped)
if (!gameOver) {
  const away = Math.min((now() - S.last) / 1000, OFFLINE_CAP_S);
  if (away > 5) { S.cycles += totalRate() * away; decayNeeds(away, 30); S.cat.hunger = Math.max(10, S.cat.hunger - away * 0.008); } // absence never drops needs below 30
  billsTick(); trashTick();
  // an unlocked door and a long absence: someone came in
  if (!S.doorLocked && awayMs > 2 * 3600000 && S.usd > 1) { S.burgled = S.usd * 0.3; S.usd -= S.burgled; }
}
S.last = now();

if (gameOver) {
  document.getElementById("gameover").hidden = false;
  document.getElementById("goDays").textContent = awayDays;
}
function newGame() { try { localStorage.removeItem(SAVE_KEY); localStorage.setItem("bd-intro", "1"); } catch (e) {} location.reload(); }
document.getElementById("newcase").addEventListener("click", newGame);

async function fetchWorld() {
  try {
    const w = await (await fetch(`worldstate.json?lang=${LANG}&t=${now()}`, { cache: "no-store" })).json();
    for (const m of w.mods) {
      if (!S.mods[m.id]) S.mods[m.id] = { ...m, until: now() + m.dur_min * 60000 };
    }
    for (const id in S.mods) if (S.mods[id].until < now()) delete S.mods[id];
    if (w.market) {
      Object.assign(S, { price: w.market.bdc, hist: w.market.hist, market: w.market });
      const ch = w.market.change1h; // a real ±3% hour on BTC is a market event in the game
      if (Math.abs(ch) >= 3 && now() - (S.lastEvent || 0) > 3600000) { S.lastEvent = now(); if (typeof marketEvent === "function") marketEvent(ch < 0 ? "crash" : "pump", ch); }
    }
    if (w.weather) S.weather = w.weather;
    renderNews();
  } catch (e) { /* offline: keep last known state */ }
}

// Called by the TV in scene.js after the sponsored spot finishes.
function claimAd(id) {
  const m = S.mods[id];
  if (!m || S.claimed[id]) return;
  S.claimed[id] = true;
  S.bonus = { line: m.line, mult: m.reward.mult + AD_EXTRA[S.furn.tv], until: now() + m.reward.dur_min * 60000 };
  save(); renderNews();
}

function renderLines() {
  document.getElementById("lines").innerHTML = Object.keys(LINES).map(l => {
    const mu = lineMult(l);
    const cls = mu > 1 ? "up" : mu < 1 ? "down" : "";
    return `<div class="card row"><div><div class="name">${LINES[l].name} <span class="sub">${tr("nv")} ${S.levels[l]}</span></div>
      <div class="sub">${fmt(lineRate(l))}/s <span class="${cls}">×${mu.toFixed(2)}</span></div></div>
      <button data-buy="${l}" ${S.cycles < cost(l) ? "disabled" : ""}>${fmt(cost(l))}</button></div>`;
  }).join("");
}

function renderNews() {
  const list = Object.entries(S.mods).filter(([, m]) => m.until > now());
  document.getElementById("news").innerHTML = list.map(([id, m]) => {
    const min = Math.ceil((m.until - now()) / 60000);
    const up = m.mult >= 1;
    const ad = m.sponsored
      ? (S.claimed[id]
          ? `<div class="sub up">${tr("Bônus ×{m} ativo para {line}", { m: m.reward.mult, line: LINES[m.line].name })}</div>`
          : `<div class="sub" style="margin-top:6px">${tr(owns("tv") ? "📺 Passando na TV: assista para ganhar ×{m} por {d} min" : "📻 Tocando no rádio: ouça para ganhar ×{m} por {d} min", { m: m.reward.mult, d: m.reward.dur_min })}</div>`)
      : "";
    return `<div class="card ${m.sponsored ? "sponsored" : ""}"><div class="row"><span class="tag">${m.sponsored ? tr("PATROCINADO · ") + esc(m.advertiser) : tr(m.faction)}</span>
      <span class="${up ? "up" : "down"}">${LINES[m.line].name} ×${m.mult} · ${min}min</span></div>
      <div style="margin-top:6px">${esc(m.headline)}</div>${ad}</div>`;
  }).join("") || `<div class="sub">${tr("Nenhum sinal ativo.")}</div>`;
}

// pointerdown, not click: the HUD re-renders every 250ms and would swallow slow taps.
document.addEventListener("pointerdown", e => {
  const b = e.target.closest("[data-buy]");
  if (b && !b.disabled) { const l = b.dataset.buy; if (S.cycles >= cost(l)) { S.cycles -= cost(l); S.levels[l]++; } }
});

setInterval(() => {
  if (gameOver) return;
  const t = now(), dt = Math.min((t - S.last) / 1000, 5);
  S.cycles += totalRate() * dt; S.last = t;
  billsTick(); trashTick(); decayNeeds(dt); renderNeeds();
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

// dev-only live reload: refresh when project files change on the PC
let ver = null;
setInterval(async () => {
  try { const v = await (await fetch("/__v")).text(); if (ver && v !== ver) { save(); location.reload(); } ver = v; } catch (e) {}
}, 2000);
