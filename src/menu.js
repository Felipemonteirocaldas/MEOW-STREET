import { audio } from "./ui/radio.js";
import { EGG_TOTAL, S, SAVE_KEY, gameOver, save } from "./game/state.js";
import { ACHIEVEMENTS, unlocked } from "./game/achievements.js";
import { LANG, tr } from "./lang.js";
import { say } from "./characters/dex.js";
import { newGame } from "./game/production.js";
import { creatorHTML, paintCreator } from "./ui/creator.js";
import { startVacation } from "./ui/vacation.js";

// Opening screen, main menu, new-case intro, pause menu and options.
const menuEl = document.getElementById("menu"), menuc = document.getElementById("menuc");
export let OPTS = { volume: 0.7, flashes: true, motion: true, film: true, haptics: true, tscale: 1 };
try { Object.assign(OPTS, JSON.parse(localStorage.getItem("bd-opts") || "{}")); } catch (e) {}
export const saveOpts = () => { try { localStorage.setItem("bd-opts", JSON.stringify(OPTS)); } catch (e) {} audio.volume = OPTS.volume;
const applyFilm = () => { document.body.classList.toggle("nofilm", !OPTS.film); document.documentElement.style.setProperty("--ts", OPTS.tscale || 1); };
applyFilm(); };
audio.volume = OPTS.volume;

let menuRoot = "main", introStep = 0, creatorNext = "intro"; // creatorNext: where "Pronto" goes (the intro of a new case, or back to the pause menu)
const saved = () => { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } };
const INTRO = [
  "Nova York, 1986. Chove há três dias.",
  "A companhia telefônica me demitiu numa terça. Fiquei com um colchão velho, um rádio de pilha... e o R2-DEBT.",
  "Um computador que ninguém sabe quem fabricou. Ele imprime as manchetes do mundo real. E minera uma moeda que ainda não existe.",
  "Contas debaixo da porta. Geladeira quase vazia. Hora de trabalhar.",
];
const btns = list => `<div class="menu-btns">${list.map(([go, label]) => `<button data-go="${go}">${tr(label)}</button>`).join("")}</div>`;
const panel = (title, paras) => `<h2 class="menu-h">${tr(title)}</h2><div class="menu-text">${paras.map(p => tr(p)).join("")}</div>${btns([["back", "Voltar"]])}`;
const SCREENS = {
  opening: () => `<div class="op-meta">${tr("CASO Nº 4B · NOVA YORK, 1986")}</div><h1 class="op-title">MEOW-STREET</h1>
    <div class="op-sub">${tr("UM IDLE NOIR MOVIDO PELO MUNDO REAL")}</div>
    <div class="op-meta">${tr("O COMPUTADOR SABE O QUE ESTÁ ACONTECENDO LÁ FORA.<br>VOCÊ SÓ PRECISA SOBREVIVER AQUI DENTRO.")}</div>
    <div class="op-go">${tr("— toque para continuar —")}</div>`,
  main: () => `<h1 class="op-title small">MEOW-STREET</h1><div class="op-sub">${tr("APT 4B · NOVA YORK")}</div>`
    + btns([...(saved() && !gameOver ? [["resume", "Continuar"]] : []), ["new", "Novo caso"], ["ach", "Conquistas"], ["how", "Como jogar"], ["opts", "Opções"], ["credits", "Créditos"]]),
  pause: () => `<h2 class="menu-h">${tr("PAUSADO")}</h2><div class="op-sub">${tr("A CIDADE NÃO PARA. NEM O R2-DEBT.")}</div>`
    + btns([["resume", "Retomar"], ["ach", "Conquistas"], ["how", "Como jogar"], ["lore", "A história"], ["creator", "Aparência"], ["vacation", "Tirar férias"], ["opts", "Opções"], ["new", "Novo caso"], ["main", "Menu principal"]]),
  creator: creatorHTML,
  intro: () => `<div class="intro-card"><p class="intro-text"></p><div class="op-go">${introStep < INTRO.length - 1 ? tr("— toque para continuar —") : ""}</div>
    ${introStep === INTRO.length - 1 ? btns([["start", "Começar"]]) : ""}</div>`,
  how: () => panel("Como jogar", [
    "<p><b>O Dex vive sozinho.</b> Ele come, dorme, toma banho e trabalha por conta própria, mas você pode tocar no chão para ele andar e tocar nos objetos para usá-los.</p>",
    "<p><b>O R2-DEBT minera BDC</b>, uma moeda que segue o Bitcoin real minuto a minuto. Venda BDC na <b>Corretora</b> para ter dólares.</p>",
    "<p><b>Dólares pagam as contas</b> que chegam por baixo da porta e os móveis do <b>Catálogo</b>. Você começa com quase nada.</p>",
    "<p><b>As notícias são reais.</b> Elas aceleram ou freiam a produção do R2-DEBT.</p>",
    "<p><b>Sombra, o gato preto,</b> lê as notícias melhor que você. Dê ração (toque na tigela) e carinho (toque nele). Quanto mais ele gostar de você, melhores as dicas, sempre tiradas das manchetes e do mercado real.</p>",
    "<p><b>Cuidado:</b> luz vencida corta a energia, corretores no telefone costumam ser golpistas, porta destrancada atrai ladrões e uma semana sem visitar o Dex é o fim do caso.</p>",
    "<p>Arraste para mover a câmera, faça pinça para dar zoom. Há pistas escondidas que só o super zoom revela.</p>"]),
  lore: () => panel("A história", [
    "<p>Dex Moreno consertava linhas telefônicas até ser demitido sem explicação. No apartamento 4B sobraram um colchão, um rádio e um computador que ninguém lembra de ter comprado: o R2-DEBT.</p>",
    "<p>O R2-DEBT lê o mundo antes de todo mundo. Lena, a única que sabia de onde ele veio, sumiu em 1984. Um cachorro preto às vezes aparece na escada de incêndio.</p>",
    "<p><i>Pague as contas. Siga as pistas. Não confie em ninguém. Nem na máquina.</i></p>"]),
  credits: () => panel("Créditos", [
    "<p><b>MEOW-STREET</b> · protótipo 0.1</p>",
    "<p>Dados reais: cotação BTC (Binance, CoinGecko), clima de Nova York (Open-Meteo), manchetes (Tecnoblog, Olhar Digital, Canaltech, TecMundo, Hacker News, The Verge, Ars Technica, TechCrunch), rádios (Radio Browser).</p>",
    "<p>Fontes: Special Elite, UnifrakturMaguntia, VT323 (Google Fonts).</p>"]),
  opts: () => `<h2 class="menu-h">${tr("Opções")}</h2><div class="menu-text">
    <div class="opt-row"><span>${tr("Idioma · Language")}</span><button data-lang>${LANG === "pt" ? "PORTUGUÊS" : "ENGLISH"}</button></div>
    <div class="opt-row"><span>${tr("Volume do rádio")}</span><input type="range" min="0" max="1" step="0.05" value="${OPTS.volume}" data-opt="volume"></div>
    <div class="opt-row"><span>${tr("Luzes piscando (raios, neon)")}</span><button data-toggle="flashes">${tr(OPTS.flashes ? "LIGADO" : "DESLIGADO")}</button></div>
    <div class="opt-row"><span>${tr("Visual de filme (granulação, cores lavadas)")}</span><button data-toggle="film">${tr(OPTS.film ? "LIGADO" : "DESLIGADO")}</button></div>
    <div class="opt-row"><span>${tr("Zoom cinematográfico")}</span><button data-toggle="motion">${tr(OPTS.motion ? "LIGADO" : "DESLIGADO")}</button></div>
    <div class="opt-row"><span>${tr("Vibração (celular)")}</span><button data-toggle="haptics">${tr(OPTS.haptics ? "LIGADO" : "DESLIGADO")}</button></div>
    <div class="opt-row"><span>${tr("Tamanho do texto dos menus")}</span><button data-tscale>${["A", "A+", "A++"][[1, 1.15, 1.3].indexOf(OPTS.tscale || 1)] || "A"}</button></div>
    <div class="opt-row"><span>${tr("Backup do save")}</span><button data-go="backup">${tr("ABRIR")}</button></div>
    </div>${btns([["back", "Voltar"]])}`,
  ach: () => {
    const n = unlocked();
    return `<h2 class="menu-h">${tr("Conquistas")}</h2><div class="ach-sum">${n} / ${ACHIEVEMENTS.length}</div><div class="ach-list">${ACHIEVEMENTS.map(a => `<div class="ach ${S.ach[a.id] ? "" : "lock"}"><i>${S.ach[a.id] ? "🏆" : "🔒"}</i><div><b>${tr(a.name)}</b><span>${tr(a.desc, { n: EGG_TOTAL })}</span></div></div>`).join("")}</div>${btns([["back", "Voltar"]])}`;
  },
  backup: () => `<h2 class="menu-h">${tr("Backup do save")}</h2><div class="menu-text backup"><p>${tr("Copie este código para guardar seu progresso. Para voltar a um save antigo ou levar o jogo para outro aparelho, cole o código no campo de baixo e importe.")}</p>
    <textarea readonly id="bk-out">${exportSave()}</textarea><div class="opt-row"><span></span><button data-copy>${tr("COPIAR")}</button></div>
    <textarea id="bk-in" placeholder="${tr("Cole um código aqui")}"></textarea><div class="opt-row"><span id="bk-msg"></span><button data-import>${tr("IMPORTAR")}</button></div></div>${btns([["back", "Voltar"]])}`,
};
const exportSave = () => { save(); try { return btoa(unescape(encodeURIComponent(localStorage.getItem(SAVE_KEY) || "{}"))); } catch (e) { return ""; } };
function importSave(code) { // only accepts something that looks like one of our saves; the next load fills in anything missing
  try { const s = JSON.parse(decodeURIComponent(escape(atob(code.trim())))); if (typeof s.cycles !== "number" || typeof s.usd !== "number" || !s.levels) return false; s.lastSeen = Date.now(); localStorage.setItem(SAVE_KEY, JSON.stringify(s)); return true; } catch (e) { return false; }
}
function show(screen) {
  menuEl.hidden = false; menuEl.dataset.screen = screen; menuc.innerHTML = SCREENS[screen]();
  menuEl.scrollTop = 0;
  if (!["opening", "intro", "main"].includes(screen)) { // every screen can be left from the top, however long the page is
    const pause = screen === "pause";
    menuc.insertAdjacentHTML("afterbegin", `<button class="menu-x" data-go="${pause ? "resume" : screen === "creator" ? "creator-done" : "back"}" aria-label="${tr(pause ? "Fechar" : "Voltar")}">${pause ? "✕" : "←"}</button>`);
  }
  if (screen === "intro") typeIntro();
  if (screen === "creator") paintCreator();
}
function typeIntro() {
  const el = menuc.querySelector(".intro-text"), text = tr(INTRO[introStep]); let i = 0;
  const iv = setInterval(() => { if (!el.isConnected) return clearInterval(iv); el.textContent = text.slice(0, ++i); if (i >= text.length) clearInterval(iv); }, 28);
}
menuEl.addEventListener("click", e => {
  const screen = menuEl.dataset.screen, go = e.target.closest("[data-go]"), tog = e.target.closest("[data-toggle]");
  if (tog) { OPTS[tog.dataset.toggle] = !OPTS[tog.dataset.toggle]; saveOpts(); applyFilm(); return show("opts"); }
  if (e.target.closest("[data-tscale]")) { const t = [1, 1.15, 1.3]; OPTS.tscale = t[(t.indexOf(OPTS.tscale || 1) + 1) % 3]; saveOpts(); applyFilm(); return show("opts"); }
  if (e.target.closest("[data-copy]")) { const t = menuc.querySelector("#bk-out"); t.select(); try { navigator.clipboard.writeText(t.value); } catch (x) { document.execCommand("copy"); } e.target.textContent = tr("COPIADO"); return; }
  if (e.target.closest("[data-import]")) { const ok = importSave(menuc.querySelector("#bk-in").value); if (ok) return location.reload(); menuc.querySelector("#bk-msg").textContent = tr("Código inválido"); return; }
  if (e.target.closest("[data-lang]")) { // switch the whole game's language (and the news feed): drop current headlines and reload
    OPTS.lang = LANG === "pt" ? "en" : "pt"; saveOpts(); S.mods = {}; save(); return location.reload();
  }
  if (!go) {
    if (screen === "opening") return show("main");
    if (screen === "intro" && introStep < INTRO.length - 1) { introStep++; return show("intro"); }
    return;
  }
  switch (go.dataset.go) {
    case "resume": case "start": menuEl.hidden = true; if (go.dataset.go === "start") say("Certo, R2-DEBT. Vamos ver o que o mundo tem pra gente hoje.", 6000); break;
    case "new":
      if (saved()) { if (confirm(tr("Abrir um novo caso? Todo o progresso atual será perdido."))) newGame(); return; }
      creatorNext = "intro"; return show("creator");
    case "vacation": menuEl.hidden = true; return startVacation();
    case "creator": creatorNext = "pause"; return show("creator");
    case "creator-done": if (creatorNext === "intro") { introStep = 0; return show("intro"); } return show("pause");
    case "main": menuRoot = "main"; return show("main");
    case "back": return show(menuRoot);
    default: return show(go.dataset.go);
  }
});
menuEl.addEventListener("input", e => { const r = e.target.closest("[data-opt]"); if (r) { OPTS[r.dataset.opt] = +r.value; saveOpts(); } });
document.getElementById("pausebtn").addEventListener("click", () => { menuRoot = "pause"; show("pause"); });

// boot: game over shows its own front page; a fresh "new case" goes straight to the intro; otherwise the opening screen
let introFlag = null; try { introFlag = localStorage.getItem("bd-intro"); localStorage.removeItem("bd-intro"); } catch (e) {}
if (!gameOver) { if (introFlag) { creatorNext = "intro"; show("creator"); } else show("opening"); }
