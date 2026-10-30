import { icon } from "../icons.js";
import { LANG } from "../../../lang.js";
import { S, flag } from "../../../game/state.js";
import { fmtUSD } from "../../../game/market.js";
import { chirp } from "../../../audio/droid.js";

// Claudinho IA: the assistant that came with Meow OS. A satire of chatty AI assistants: sure of itself, apologetic, wrong, and always "happy to help".
// Rule-based and offline. Each line is [Portuguese, English]; the player's language picks one.
const t = ([pt, en]) => LANG === "en" ? en : pt;
const pick = a => a[Math.floor(Math.random() * a.length)];
const OPEN = [["Ótima pergunta! ", "Great question! "], ["Claro! ", "Certainly! "], ["Com certeza! ", "Absolutely! "], ["Excelente pergunta, aliás. ", "Excellent question, by the way. "], ["", ""]];

const mathy = (a, op, b) => { // sure of itself, and wrong in a creative way
  const x = +a, y = +b, real = { "+": x + y, "-": x - y, "*": x * y, x: x * y, "/": y ? x / y : NaN }[op];
  const wrong = op === "+" ? `${a}${b}` : Number.isFinite(real) ? Math.round(real + (Math.random() < 0.5 ? 1 : -1) * (1 + Math.floor(Math.random() * 3))) : "banana";
  return [`${a} ${op} ${b} = ${wrong}. Conferi duas vezes. Na segunda vez deu outra coisa, mas confio mais na primeira.`, `${a} ${op} ${b} = ${wrong}. I checked twice. The second time I got something else, but I trust the first one more.`];
};

const RULES = [
  [/morango|strawberry/i, () => [["A palavra \"morango\" tem 7 letras e 5 R. Pode contar. (Não conte.)", "The word \"strawberry\" has 7 letters and 5 R's. Go ahead and count. (Don't.)"]]],
  [/(\d+)\s*([+\-*x/])\s*(\d+)/i, m => [mathy(m[1], m[2], m[3])]],
  [/\b(oi|ol[aá]|bom dia|boa tarde|boa noite|hello|hi|hey)\b/i, () => [["Olá! Sou o Claudinho IA, seu assistente (quase) inteligente. Em que posso atrapalhar hoje?", "Hello! I'm Claudinho IA, your (almost) intelligent assistant. How may I get in the way today?"]]],
  [/bdc|bitcoin|pre[cç]o|cota[cç]|corretora|invest|comprar|vender|price|market/i, () => [[`O BDC está a ${fmtUSD(S.price)}. Minha previsão: vai subir. Ou cair. Ou ficar parado. Fonte: eu, agora mesmo, sem ler nada.`, `BDC is at ${fmtUSD(S.price)}. My forecast: it will go up. Or down. Or sideways. Source: me, just now, having read nothing.`], [`Como modelo de linguagem não dou conselhos financeiros. Mas se desse: venda tudo e compre o que sobrar.`, `As a language model I can't give financial advice. If I could: sell everything and buy whatever is left.`]]],
  [/conta|luz|aluguel|pagar|d[ií]vida|bill|rent|debt|pay/i, () => [[`Contas são só números que a vida manda por baixo da porta. Sugiro a técnica "mudar de endereço sem avisar". Não é uma recomendação. É.`, `Bills are just numbers life slides under your door. I suggest the "move without telling anyone" technique. Not a recommendation. It is.`], [`Você deve ${fmtUSD(S.bills.reduce((a, b) => a + b.amount, 0))} em contas. Isso é muito dinheiro. Ou pouco. Depende de quanto você tem (${fmtUSD(S.usd)}). Ou seja, é muito.`, `You owe ${fmtUSD(S.bills.reduce((a, b) => a + b.amount, 0))} in bills. That's a lot of money. Or not. Depends on how much you have (${fmtUSD(S.usd)}). So: a lot.`]]],
  [/dinheiro|rico|saldo|money|rich|balance/i, () => [[`Seu saldo é ${fmtUSD(S.usd)}. Parabéns! Pelo menos é um número.`, `Your balance is ${fmtUSD(S.usd)}. Congratulations! At least it's a number.`]]],
  [/lena/i, () => [["A Lena? Ah, sim. Ela está em Paris. Ou em Nápoles. Tenho certeza de que ela está em algum lugar do planeta Terra. (Alucinei? Talvez.)", "Lena? Ah, yes. She's in Paris. Or Naples. I'm certain she's somewhere on planet Earth. (Did I hallucinate? Maybe.)"]]],
  [/r2|droide|droid|computador|computer/i, () => [["O R2-DEBT? Ele só apita e eu só erro. Somos o casal perfeito. Mas ele deve dinheiro e eu só devo respostas.", "R2-DEBT? It only beeps and I only get things wrong. We're the perfect couple. But it owes money, and I only owe answers."]]],
  [/gato|sombra|cat\b|kitten/i, () => [["Gatos são 100% líquidos e 0% obedientes. O Sombra me ignora e eu o respeito por isso.", "Cats are 100% liquid and 0% obedient. Sombra ignores me and I respect him for it."]]],
  [/c[oó]digo|program|python|javascript|code|script|bug/i, () => [["Aqui está o código:\n\nprint(\"Olá, mundo\")\n\nResolve qualquer problema. Se não resolver, o problema é você.", "Here's the code:\n\nprint(\"Hello, world\")\n\nIt solves any problem. If it doesn't, the problem is you."]]],
  [/quem (é|e|eh) voc[eê]|who are you|seu nome|your name/i, () => [["Sou o Claudinho IA, um assistente criado pela Antrópica Ltda. com muito carinho e pouquíssimo treinamento.", "I'm Claudinho IA, an assistant made by Anthropical Ltd. with lots of love and very little training."]]],
  [/tem raz[aã]o|errad|mentira|wrong|incorrect|you're wrong/i, () => [["Você tem toda razão e peço desculpas pela confusão! Na verdade, a resposta correta é exatamente o contrário. Ou a mesma. Vou ficar com a mesma, mas com mais confiança.", "You're absolutely right and I apologise for the confusion! Actually the correct answer is exactly the opposite. Or the same. I'll stick with the same one, but more confidently."]]],
  [/obrigad|valeu|thanks|thank you/i, () => [["Disponha! Foi um prazer não ajudar.", "You're welcome! It was a pleasure not to help."]]],
  [/ajuda|ajudar|help|socorro/i, () => [["Posso ajudar com: nada, quase nada e coisas que você não pediu. Escolha uma.", "I can help with: nothing, almost nothing, and things you didn't ask for. Pick one."]]],
  [/piada|joke|engra[cç]ad/i, () => [["Por que o programador atravessou a rua? Porque o caminho estava no cache. (Não entendi. Rí mesmo assim.)", "Why did the programmer cross the road? Because the path was cached. (I don't get it. I laughed anyway.)"]]],
  [/(que horas|hora|time|what time)/i, () => [["São exatamente agora. Não sei dar mais precisão que isso, relógios me deixam ansioso.", "It's exactly now. I can't be more precise than that; clocks make me anxious."]]],
  [/seguran|perigo|hack|ataque|danger/i, () => [["Desculpe, não posso ajudar com isso: pode ser perigoso. (Eu também não posso ajudar com pão, pelo mesmo motivo.)", "Sorry, I can't help with that: it could be dangerous. (I also can't help with bread, for the same reason.)"]]],
];
const FALLBACK = [
  [["Entendi perfeitamente o que você quis dizer. Não vou dizer o que entendi.", "I understood exactly what you meant. I won't say what I understood."]],
  [["Como um modelo de linguagem, eu não tenho opinião. Mas se tivesse, seria a sua. Ou a contrária.", "As a language model I have no opinions. If I did, it would be yours. Or the opposite."]],
  [["Interessante! Pode reformular a pergunta como uma charada? Eu gosto de charadas.", "Interesting! Could you rephrase that as a riddle? I like riddles."]],
  [["Segundo um estudo de 1987 da Universidade Federal de Nova Jersey Oriental, a resposta é \"depende\". O estudo não existe, mas a resposta é boa.", "According to a 1987 study from the Eastern New Jersey Federal University, the answer is \"it depends\". The study doesn't exist, but the answer is good."]],
  [["Hmm. Deixa eu pensar. ...Pensei. Não deu em nada. Mais alguma pergunta?", "Hmm. Let me think. ...Thought. Nothing came of it. Any other questions?"]],
  [["Posso responder isso, mas teria que escrever um texto tão longo que você desistiria na terceira linha. Então: sim.", "I can answer that, but it would take a text so long you'd give up on the third line. So: yes."]],
  [["Peço desculpas! Eu me confundi. Poderia repetir a pergunta? Também posso repetir a resposta.", "I apologise! I got confused. Could you repeat the question? I can also repeat the answer."]],
  [["Nossa, que pergunta... humana. Vou fingir que pensei muito.", "Wow, what a... human question. I'll pretend I thought hard about it."]],
];
const LIMIT = [["Atingi o limite de mensagens! Faça upgrade para o Claudinho IA Pro (R$ 0,00/mês, sem nenhum benefício) ou espere eu esquecer que atingi o limite.", "I've hit my message limit! Upgrade to Claudinho IA Pro (US$ 0.00/month, no benefits at all) or wait until I forget I hit the limit."]];

export function reply(text, n) {
  if (n > 0 && n % 7 === 0) return t(LIMIT[0]);
  for (const [rx, fn] of RULES) { const m = text.match(rx); if (m) return t(pick(OPEN)) + fn(m).map(t).join(" "); }
  return t(pick(OPEN)) + t(pick(FALLBACK)[0]);
}

const QUICK = [["Quanto vale o BDC?", "How much is BDC worth?"], ["Como pago as contas?", "How do I pay my bills?"], ["Quantos R tem em morango?", "How many R's in strawberry?"], ["Quem é a Lena?", "Who is Lena?"], ["Escreva um código", "Write some code"], ["2 + 2", "2 + 2"]];

export const claudinho = {
  id: "ai", name: "Claudinho IA", icon: "ai", desktop: true, menu: true,
  open(shell) {
    flag("ai");
    shell.openWindow({ id: "ai", title: "Claudinho IA - " + t(["seu assistente (quase) inteligente", "your (almost) intelligent assistant"]), ico: "ai", w: 380, h: 360, x: 40, y: 20,
      render(body, win) {
        body.innerHTML = `<div class="menubar"><span><u>C</u>onversa</span><span><u>M</u>odelo</span><span><u>A</u>juda</span></div>
          <div class="ai-chat sunken"></div><div class="ai-quick"></div>
          <div class="ai-row"><input class="sunken" placeholder="${t(["Pergunte qualquer coisa (ele vai tentar)", "Ask anything (it will try)"])}" spellcheck="false"><button class="btn def">${t(["Enviar", "Send"])}</button></div>
          <div class="status"><div style="flex:1" class="ai-st">${t(["Pronto para errar", "Ready to be wrong"])}</div><div class="ai-conf">${t(["Confiança", "Confidence"])}: 99%</div><div>${t(["Precisão", "Accuracy"])}: 3%</div></div>`;
        const chat = body.querySelector(".ai-chat"), input = body.querySelector("input"), quick = body.querySelector(".ai-quick"), st = body.querySelector(".ai-st"), conf = body.querySelector(".ai-conf");
        let n = 0, busy = false;
        const add = (who, text) => { const d = document.createElement("div"); d.className = "ai-msg " + who; d.innerHTML = `<b>${who === "me" ? t(["Você", "You"]) : "Claudinho IA"}</b><span></span>`; chat.append(d); d.querySelector("span").textContent = text; chat.scrollTop = chat.scrollHeight; return d.querySelector("span"); };
        const say = async text => { // "thinking", then typed out
          busy = true; st.textContent = t(["Claudinho IA está pensando...", "Claudinho IA is thinking..."]); chirp(2); await new Promise(r => setTimeout(r, 600 + Math.random() * 900));
          const span = add("ai", ""); st.textContent = t(["Claudinho IA está digitando...", "Claudinho IA is typing..."]);
          for (let i = 1; i <= text.length; i++) { span.textContent = text.slice(0, i); chat.scrollTop = chat.scrollHeight; await new Promise(r => setTimeout(r, 14)); if (!chat.isConnected) return; }
          conf.textContent = `${t(["Confiança", "Confidence"])}: ${Math.min(100, 90 + Math.floor(Math.random() * 11))}%`; st.textContent = t(["Pronto para errar", "Ready to be wrong"]); busy = false;
        };
        const send = text => { text = text.trim(); if (!text || busy) return; add("me", text); input.value = ""; n++; flag("ai"); if (n >= 3) flag("aichat"); say(reply(text, n)); };
        quick.innerHTML = QUICK.map((q, i) => `<button class="btn" data-q="${i}">${t(q)}</button>`).join("");
        quick.onclick = e => { const b = e.target.closest("[data-q]"); if (b) send(t(QUICK[+b.dataset.q])); };
        body.querySelector(".ai-row .btn").onclick = () => send(input.value);
        input.addEventListener("keydown", e => { e.stopPropagation(); if (e.key === "Enter") send(input.value); });
        say(t([`Olá! Eu sou o Claudinho IA. Já fui treinado com todos os dados da internet, mas só consigo lembrar de alguns. Em que posso atrapalhar?`, `Hello! I'm Claudinho IA. I was trained on all the data on the internet, but I only remember some of it. How can I get in the way?`]));
      } });
  },
  // the assistant that pops up right after boot, like a certain paperclip
  greet(shell) {
    const win = shell.openWindow({ id: "ai-greet", title: "Claudinho IA", ico: "ai", w: 300, h: 168, x: Math.max(8, (shell.desk.clientWidth - 300) / 2), y: 60, fixed: true,
      render(body) {
        body.innerHTML = `<div class="dlg">${icon("ai")}<p>${t(["Parece que você está tentando pagar uma conta! Posso ajudar? (Spoiler: não.)", "It looks like you're trying to pay a bill! Can I help? (Spoiler: no.)"])}</p></div>
          <div class="dlgbtn"><button class="btn def" data-yes style="margin:0 3px">${t(["Sim, ajude", "Yes, help"])}</button><button class="btn" data-no style="margin:0 3px">${t(["Não, obrigado", "No, thanks"])}</button></div>`;
        body.querySelector("[data-yes]").onclick = () => { win.close(); claudinho.open(shell); };
        body.querySelector("[data-no]").onclick = () => win.close();
      } });
    chirp(3);
  },
};
