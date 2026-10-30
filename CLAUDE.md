# MEOW-STREET — mapa do código

O computador se chama R2-DEBT (sátira de droide astromecânico: apita, "traduz" e deve dinheiro). Marcos únicos do jogador (`flag("pc")`, `flag("sold")`…) ficam em `S.flags` e alimentam conquistas e tutorial.

ES modules + Vite. Cada arquivo importa só o que usa (`import { x } from "..."`), então dá para abrir um arquivo sem ler o resto.
- Dev: `npm run dev` → http://localhost:8090 (Vite, recarrega ao salvar; `serve.py` roda junto na 8091 para o `/worldstate.json` e o `/proxy` do navegador do PC). HTTPS no proxy precisa de `pip install certifi`.
- Build: `npm run build` → `dist/`.
- Entrada: `src/main.js` (lista todos os módulos em ordem). **Móvel novo = arquivo novo + uma linha no `main.js`** (a ordem do `main.js` é a ordem de registro dos objetos).
- Módulo não pode atribuir a variável importada: use o setter exportado (`setHL`, `setDogUntil`, `setTvPending`, `shake`, `setDrawCtx`) ou um objeto (`wc`).
- Cuidado com ciclos de import: código que roda no carregamento do módulo (fora de função) só pode usar o que já foi avaliado. O que roda na partida está em `src/game/boot.js` (último do `main.js`).
- Textos e comentários em PT-BR; `src/lang.js` traduz pelo texto-fonte em português.

| Quero mexer em… | Arquivo |
|---|---|
| Animação do Dex (xixi/cocô/banho, tombo; o corpo em si é `figure.js`) | `src/characters/dex-draw.js` |
| Aparência do Dex (criador de personagem: corpo, pele, cabelo, rosto, roupas, cores) | `src/characters/look.js` (dados e opções), `figure.js` (desenho em qualquer canvas), `src/ui/creator.js` (tela do menu) |
| Comportamento do Dex (andar, necessidades, `busy`, `use`) | `src/characters/dex.js` |
| Falas do Dex reagindo a eventos (barata, tombo, gato, vizinho, luz cortada) | `src/characters/reactions.js` |
| Gato / R2-DEBT / barata / vizinho | `src/characters/cat.js`, `bd1.js`, `roach.js`, `neighbour.js` |
| Um móvel | `src/furniture/<cômodo>/<id>.js` (cômodos: living, kitchen, office, bedroom, bathroom); helpers do cômodo em `_shared.js`; `obj/B/C/sit` em `furniture/core.js` |
| Qual item do catálogo cada móvel é, lixo | `src/furniture/catalog-map.js` |
| Notícias | `src/game/news.js` (dados), `src/ui/news-panel.js` (aba Notícias), `src/ui/newspaper.js` (jornal físico) |
| Aba Produção (explicações, multiplicadores, compra) | `src/ui/production-panel.js`; a conta dos multiplicadores está em `game/production.js` (`lineBreakdown`, `catMult`) |
| Economia: produção, necessidades, contas, mercado, catálogo | `src/game/production.js`, `needs.js`, `bills.js`, `market.js`, `catalog.js` |
| Férias em Pernambuco (Porto de Galinhas) (jogo pausado, viagem, praia, volta; `S.vacation`; estilo Hiroshi Nagai, céu pela hora real, toques, som) | `src/ui/vacation.js` (praia, loop, toques), `vacation-trip.js` (4 cortes da viagem), `vacation-art.js` (paleta, desenho), `src/audio/vacation.js` (som sintetizado); o que pausa checa `S.vacation` (loop, news, poker, phone, neighbour, boot) |
| Estado e save (`S`, localStorage) | `src/game/state.js` |
| Mão do Dex (vídeo-pôquer), metas do dia, clima do jogador | `src/game/poker*.js` + `src/ui/poker.js`, `daily.js`, `weather.js` |
| Loja, rádio, corretora, telefone, contas | `src/ui/shop.js`, `radio.js`, `exchange.js`, `phone.js`, `bills.js` |
| O PC (zoom no monitor, Meow OS 98, internet) | `src/ui/pc.js` (monitor/CRT), `src/ui/win98/shell.js` (janelas, Start, boot), `win98/apps/*.js` (um app por arquivo; lista em `win98/apps.js`), `win98/win98.css`, ícones em `win98/icons.js` |
| Claudinho (IA burra do Meow OS: respostas, regras, janelinha de boas-vindas) | `src/ui/win98/apps/claudinho.js` (cada resposta é um par [pt, en]; nova regra = uma linha em `RULES`) |
| Navegador do PC (Meow Explorer) | `src/ui/win98/apps/ie.js` + `/proxy` em `serve.py` (porta 8091; só aceita o próprio PC e bloqueia endereços privados) |
| HUD de baixo (necessidades, chips, abas com ícones e avisos) | `src/ui/hud.js`, ícones em `src/ui/icons.js` |
| Painel do desktop (cards ao vivo, modo painel `P`, tela cheia `F`, título da aba) | `src/ui/dashboard.js` |
| RPG: nível/XP, árvore de talentos (build), habilidades ativas, laboratório | `src/game/rpg-core.js` (dados e números; sem UI), `src/ui/dex-panel.js` (aba Dex). Novo talento = uma linha em `NODES` + onde o número é usado |
| Recomeço (prestígio): Legado, heranças, o que reseta | `src/game/prestige.js` (lógica) e a seção final de `src/ui/dex-panel.js` |
| Botão fechar, Esc e botão Voltar do celular em todo menu | `src/ui/overlay-kit.js` (cria o ✕ sozinho; menu com cleanup próprio escuta o evento `ovclose`) |
| Conquistas (lista + testes), primeiros passos (banner), vibração, som de droide | `src/game/achievements.js`, `src/game/tutorial.js`, `src/ui/haptics.js`, `src/audio/droid.js` |
| Câmera, clique/toque, pathfinding | `src/engine/camera.js`, `input.js`, `pathfind.js` |
| Desenho base (projeção iso `P`, `poly`, `box`, `cyl`) | `src/engine/draw.js` |
| Paredes/pisos/janelas, luz noir, cachorro preto | `src/world/rooms.js`, `lighting.js`, `dog.js` |
| Loop principal | `src/engine/loop.js` |
| Menu, cidade da janela, traduções | `src/menu.js`, `src/city.js`, `src/lang.js` |

Unidade do mundo: 1 tile = `T` px; `P(x, y, z)` converte mundo→tela. O Dex desenha com `u = T/10`.
