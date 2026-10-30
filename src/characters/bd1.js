import { chirp } from "../audio/droid.js";
import { CW, g, pick } from "../engine/draw.js";
import { S } from "../game/state.js";
import { tr } from "../lang.js";
import { nyc } from "../game/clock.js";

// ---------- comedy ----------
// R2-DEBT answers Dex on its green screen, deadpan
const DIALOGS = [
  ["R2-DEBT, você acha que eu sou um fracasso?", "> ANALISANDO... RESPOSTA: SIM."],
  ["R2-DEBT, quanto eu tenho no banco?", "> SALDO INSUFICIENTE PARA ESSA PERGUNTA."],
  ["R2-DEBT, me conta uma piada.", "> SUA CONTA DE LUZ."],
  ["Você sonha, R2-DEBT?", "> SONHO COM UM USUÁRIO MAIS COMPETENTE."],
  ["R2-DEBT, de onde você veio?", "> ACESSO NEGADO :)"],
  ["R2-DEBT, a Lena vai voltar?", "> ...MUDANDO DE ASSUNTO. O BDC SUBIU."],
  ["Bom dia, R2-DEBT.", "> SÃO {HORA}. NÃO É DIA. NÃO É BOM."],
  ["R2, traduz o que ele disse.", "> *BIP-BOP-WHEEE* (TRADUÇÃO: SUA CONTA DE LUZ VENCEU)"],
  ["R2-DEBT, o que você acha do plano?", "> *BWOOP... BWEEE* (TRADUÇÃO: NÃO TEM PLANO. TEM FATURA.)"],
  ["R2, me dá uma esperança.", "> *BIIP* (TRADUÇÃO: ESPERANÇA NÃO ENCONTRADA. TENTE REINICIAR.)"],
  ["Quem é o seu pai, R2?", "> *BEEP* (TRADUÇÃO: A BLACK DOG SYSTEMS. EU AINDA DEVO A ELES.)"],
  ["Você é um droide, R2?", "> *BZZT* (TRADUÇÃO: SOU UM COMPUTADOR BEGE COM COMPLEXO DE LATA.)"],
];
export let bd1 = { text: "", at: 0, until: 0 };
export function askBD1() {
  chirp(4);
  const [q, a0] = pick(DIALOGS);
  const a = S.poo && Math.random() < 0.4 ? tr("> ALERTA: DESCARGA PENDENTE NO BANHEIRO.") : tr(a0, { HORA: nyc().toTimeString().slice(0, 5) });
  bd1 = { text: a, at: Date.now() + 1800, until: Date.now() + 6500 };
  return q;
}
export function termBubble(text, x, y) {
  g.font = "13px VT323, monospace"; const w = Math.min(g.measureText(text).width + 14, CW - 12), h = 20;
  const bx = Math.max(6, Math.min(x - w / 2, CW - w - 6)), by = Math.max(4, y - h - 6);
  g.fillStyle = "rgba(5,12,7,.95)"; g.strokeStyle = "#39d98a"; g.lineWidth = 1; g.beginPath(); g.roundRect(bx, by, w, h, 2); g.fill(); g.stroke();
  g.fillStyle = "#39d98a"; g.fillText(text, bx + 7, by + 14);
}

