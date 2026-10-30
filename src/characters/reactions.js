import { pick } from "../engine/draw.js";
import { say } from "./dex.js";

// Dex reacting to what just happened: one pool per event, movie/show jokes mixed in with the plain ones.
const REACT = {
  roach: [
    "Alien, o oitavo passageiro. Versão kitchenette.",
    "No espaço ninguém ouve você gritar. No 4B, o síndico também não.",
    "Ripley daria um jeito. Eu tenho um chinelo.",
    "Isso é um xenomorfo? ...Não, é uma barata. Pior.",
  ],
  roachKill: [
    "A vida encontra um caminho. Eu encontrei o chinelo.",
    "Missão cumprida, capitão. Tá, era só uma barata.",
    "Está morta. Ou fingindo, como em todo filme de terror.",
    "Segurem as pontas. Acabou.",
  ],
  roachMiss: [
    "Menina esperta.",
    "Errei. Ela riu de mim.",
    "Ela é mais rápida que o meu salário.",
    "Ela escapou. Sempre sobra uma pra contar a história.",
  ],
  slip: [
    "Quem deixou isso aqui? ...Ah. Fui eu.",
    "Já passei por coisa pior. Nakatomi Plaza, descalço.",
    "Charlie Chaplin ficaria orgulhoso.",
    "Isso doeu mais que o final de Game of Thrones.",
  ],
  knock: [
    "Ele me olhou nos olhos e empurrou. Michael Corleone seria menos frio.",
    "Houston, o copo caiu.",
    "SOMBRA! Desce daí!",
    "Gato preto, sete vidas, zero modos.",
  ],
  neighbour: [
    "O vizinho do 4A de novo. Com o cabo da vassoura.",
    "Tá bom, tá bom! Abaixa o rádio, Dex. Janela Indiscreta ao contrário.",
    "O 4A é o Newman do meu Seinfeld.",
  ],
  powerCut: [
    "Cortaram a luz. De novo.",
    "Noir de verdade: sem energia elétrica.",
    "A escuridão cai, e a conta chega junto.",
  ],
};
export const react = (kind, ms) => say(pick(REACT[kind]), ms);
