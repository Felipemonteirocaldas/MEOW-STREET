// Opening screen, main menu, new-case intro, pause menu and options.
const menuEl = document.getElementById("menu"), menuc = document.getElementById("menuc");
let OPTS = { volume: 0.7, flashes: true, motion: true };
try { Object.assign(OPTS, JSON.parse(localStorage.getItem("bd-opts") || "{}")); } catch (e) {}
const saveOpts = () => { try { localStorage.setItem("bd-opts", JSON.stringify(OPTS)); } catch (e) {} audio.volume = OPTS.volume; };
audio.volume = OPTS.volume;

let menuRoot = "main", introStep = 0;
const saved = () => { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } };
const INTRO = [
  "Nova York, 1986. Chove há três dias.",
  "A companhia telefônica me demitiu numa terça. Fiquei com um colchão velho, um rádio de pilha... e o BD-1.",
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
    + btns([...(saved() && !gameOver ? [["resume", "Continuar"]] : []), ["new", "Novo caso"], ["how", "Como jogar"], ["opts", "Opções"], ["credits", "Créditos"]]),
  pause: () => `<h2 class="menu-h">${tr("PAUSADO")}</h2><div class="op-sub">${tr("A CIDADE NÃO PARA. NEM O BD-1.")}</div>`
    + btns([["resume", "Retomar"], ["how", "Como jogar"], ["lore", "A história"], ["opts", "Opções"], ["new", "Novo caso"], ["main", "Menu principal"]]),
  intro: () => `<div class="intro-card"><p class="intro-text"></p><div class="op-go">${introStep < INTRO.length - 1 ? tr("— toque para continuar —") : ""}</div>
    ${introStep === INTRO.length - 1 ? btns([["start", "Começar"]]) : ""}</div>`,
  how: () => panel("Como jogar", [
    "<p><b>O Dex vive sozinho.</b> Ele come, dorme, toma banho e trabalha por conta própria, mas você pode tocar no chão para ele andar e tocar nos objetos para usá-los.</p>",
    "<p><b>O BD-1 minera BDC</b>, uma moeda que segue o Bitcoin real minuto a minuto. Venda BDC na <b>Corretora</b> para ter dólares.</p>",
    "<p><b>Dólares pagam as contas</b> que chegam por baixo da porta e os móveis do <b>Catálogo</b>. Você começa com quase nada.</p>",
    "<p><b>As notícias são reais.</b> Elas aceleram ou freiam a produção do BD-1.</p>",
    "<p><b>Sombra, o gato preto,</b> lê as notícias melhor que você. Dê ração (toque na tigela) e carinho (toque nele). Quanto mais ele gostar de você, melhores as dicas, sempre tiradas das manchetes e do mercado real.</p>",
    "<p><b>Cuidado:</b> luz vencida corta a energia, corretores no telefone costumam ser golpistas, porta destrancada atrai ladrões e uma semana sem visitar o Dex é o fim do caso.</p>",
    "<p>Arraste para mover a câmera, faça pinça para dar zoom. Há pistas escondidas que só o super zoom revela.</p>"]),
  lore: () => panel("A história", [
    "<p>Dex Moreno consertava linhas telefônicas até ser demitido sem explicação. No apartamento 4B sobraram um colchão, um rádio e um computador que ninguém lembra de ter comprado: o BD-1.</p>",
    "<p>O BD-1 lê o mundo antes de todo mundo. Lena, a única que sabia de onde ele veio, sumiu em 1984. Um cachorro preto às vezes aparece na escada de incêndio.</p>",
    "<p><i>Pague as contas. Siga as pistas. Não confie em ninguém. Nem na máquina.</i></p>"]),
  credits: () => panel("Créditos", [
    "<p><b>MEOW-STREET</b> · protótipo 0.1</p>",
    "<p>Dados reais: cotação BTC (Binance, CoinGecko), clima de Nova York (Open-Meteo), manchetes (Tecnoblog, Olhar Digital, Canaltech, TecMundo, Hacker News, The Verge, Ars Technica, TechCrunch), rádios (Radio Browser).</p>",
    "<p>Fontes: Special Elite, UnifrakturMaguntia, VT323 (Google Fonts).</p>"]),
  opts: () => `<h2 class="menu-h">${tr("Opções")}</h2><div class="menu-text">
    <div class="opt-row"><span>${tr("Idioma · Language")}</span><button data-lang>${LANG === "pt" ? "PORTUGUÊS" : "ENGLISH"}</button></div>
    <div class="opt-row"><span>${tr("Volume do rádio")}</span><input type="range" min="0" max="1" step="0.05" value="${OPTS.volume}" data-opt="volume"></div>
    <div class="opt-row"><span>${tr("Luzes piscando (raios, neon)")}</span><button data-toggle="flashes">${tr(OPTS.flashes ? "LIGADO" : "DESLIGADO")}</button></div>
    <div class="opt-row"><span>${tr("Zoom cinematográfico")}</span><button data-toggle="motion">${tr(OPTS.motion ? "LIGADO" : "DESLIGADO")}</button></div>
    </div>${btns([["back", "Voltar"]])}`,
};
function show(screen) {
  menuEl.hidden = false; menuEl.dataset.screen = screen; menuc.innerHTML = SCREENS[screen]();
  if (screen === "intro") typeIntro();
}
function typeIntro() {
  const el = menuc.querySelector(".intro-text"), text = tr(INTRO[introStep]); let i = 0;
  const iv = setInterval(() => { if (!el.isConnected) return clearInterval(iv); el.textContent = text.slice(0, ++i); if (i >= text.length) clearInterval(iv); }, 28);
}
menuEl.addEventListener("click", e => {
  const screen = menuEl.dataset.screen, go = e.target.closest("[data-go]"), tog = e.target.closest("[data-toggle]");
  if (tog) { OPTS[tog.dataset.toggle] = !OPTS[tog.dataset.toggle]; saveOpts(); return show("opts"); }
  if (e.target.closest("[data-lang]")) { // switch the whole game's language (and the news feed): drop current headlines and reload
    OPTS.lang = LANG === "pt" ? "en" : "pt"; saveOpts(); S.mods = {}; save(); return location.reload();
  }
  if (!go) {
    if (screen === "opening") return show("main");
    if (screen === "intro" && introStep < INTRO.length - 1) { introStep++; return show("intro"); }
    return;
  }
  switch (go.dataset.go) {
    case "resume": case "start": menuEl.hidden = true; if (go.dataset.go === "start") say("Certo, BD-1. Vamos ver o que o mundo tem pra gente hoje.", 6000); break;
    case "new":
      if (saved()) { if (confirm(tr("Abrir um novo caso? Todo o progresso atual será perdido."))) newGame(); return; }
      introStep = 0; return show("intro");
    case "main": menuRoot = "main"; return show("main");
    case "back": return show(menuRoot);
    default: return show(go.dataset.go);
  }
});
menuEl.addEventListener("input", e => { const r = e.target.closest("[data-opt]"); if (r) { OPTS[r.dataset.opt] = +r.value; saveOpts(); } });
document.getElementById("pausebtn").addEventListener("click", () => { menuRoot = "pause"; show("pause"); });

// boot: game over shows its own front page; a fresh "new case" goes straight to the intro; otherwise the opening screen
let introFlag = null; try { introFlag = localStorage.getItem("bd-intro"); localStorage.removeItem("bd-intro"); } catch (e) {}
if (!gameOver) { if (introFlag) { introStep = 0; show("intro"); } else show("opening"); }
