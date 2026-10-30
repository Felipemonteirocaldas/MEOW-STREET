// What each catalog item really does in the game, in plain words. kind: need (a stat), prod (production), story (clues), cozy (cat/light/look)
export const FX = {
  desk: [["cozy", "Tira o R2-DEBT dos caixotes"], ["cozy", "Luz de mesa sobre o PC"]],
  deskchair: [["need", "O Dex trabalha sentado"]],
  tv: [["need", "Ânimo +25 ao assistir (sobe com upgrades)"], ["prod", "Comerciais na TV dão bônus de produção"]],
  sofa: [["need", "Energia +5 num cochilo"], ["cozy", "O Sombra gosta de cochilar nele"]],
  armchair: [["need", "Ânimo +10 lendo"], ["cozy", "Segunda cama do Sombra"]],
  coffee: [["cozy", "Só decoração"]], rug: [["cozy", "Só decoração"]],
  shelf: [["story", "Esconde uma pista da história"]], lamp: [["cozy", "Luz quente na sala"]],
  records: [["cozy", "Troca o rádio de pilha por um Hi-Fi de madeira"], ["need", "Música no ar sobe o ânimo devagar"]],
  clock: [["story", "Uma pista, e a hora de Nova York"]], cork: [["story", "Mural com várias pistas"]],
  ktable: [["need", "Ânimo +12 lendo o jornal"], ["cozy", "Lâmpada acesa na cozinha"]],
  counter: [["need", "Energia +8 com café"]],
  bed: [["need", "Dorme bem mais rápido que no colchão"], ["cozy", "Primeira escolha de cama do Sombra"]],
  nightstand: [["cozy", "Despertador e luz de cabeceira"]], wardrobe: [["story", "Esconde uma pista da história"]],
  tub: [["need", "Higiene +60 de uma vez (o chuveiro dá +40)"], ["story", "Tem um patinho de borracha"]],
  ticker: [["prod", "Abre a Corretora direto do escritório"]],
  cabinets: [["cozy", "Enchem conforme a linha de Dados cresce"]], floppies: [["cozy", "Enchem conforme a linha de Software cresce"]],
  safe: [["story", "Guarda o maior segredo"]],
};
export const FX_ICON = { need: "♥", prod: "⚙", story: "✎", cozy: "☾" };
