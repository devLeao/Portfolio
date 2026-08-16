/**
 * Sprites do mundo pixel, escritos como bitmap.
 *
 * Cada string é uma linha, cada caractere um pixel. Nada é baixado: um GIF de
 * gato custaria 40–200KB e viria com a resolução travada; aqui o mesmo gato
 * escala para qualquer tamanho sem borrar e ainda muda de cor por token.
 *
 * Legenda:
 *   . transparente   k contorno   w corpo claro
 *   p roxo           r rosa       g verde   y dourado
 */

export type Paleta = Record<string, string>;

export const PALETA_GATO: Paleta = {
  k: "#100A18",
  w: "#F5F1EA",
  p: "var(--color-iris)",
  r: "#F9A8D4",
};

/**
 * Corpo do gato — igual nos dois quadros.
 *
 * A última linha FECHA o contorno de baixo. Sem ela o gato fica com a
 * barriga aberta e as patas parecem dois blocos soltos flutuando embaixo.
 */
const GATO_CORPO = [
  "..kk........kk..",
  ".kwwk......kwwk.",
  ".kwrwk....kwrwk.",
  ".kwwwkkkkkkwwwk.",
  ".kwwwwwwwwwwwwk.",
  "kwwkwwwwwwkwwwwk",
  "kwwwwwwwwwwwwwwk",
  "kwwwwwrrwwwwwwwk",
  "kwwwwwwwwwwwwwwk",
  ".kwwwwwwwwwwwwk.",
  "..kkwwwwwwwwkk..",
  "...kkkkkkkkkk...",
];

/** Patas embaixo — o quadro em que ele bateu. */
export const GATO_BATE = [...GATO_CORPO, "..kppk....kppk..", "................"];

/** Patas levantadas — o quadro entre uma batida e outra. */
export const GATO_LEVANTA = [...GATO_CORPO, "................", "..kppk....kppk.."];

/** Gato olhando para cima — o do rodapé, dizendo "tem mais coisa acima". */
export const GATO_OLHA = [
  "..kk........kk..",
  ".kwwk......kwwk.",
  ".kwrwk....kwrwk.",
  ".kwwwkkkkkkwwwk.",
  ".kwwwwwwwwwwwwk.",
  "kwwkkwwwwkkwwwwk",
  "kwwwwwwwwwwwwwwk",
  "kwwwwwrrwwwwwwwk",
  "kwwwwwwwwwwwwwwk",
  ".kwwwwwwwwwwwwk.",
  "..kwwwwwwwwwwk..",
  "...kkkkkkkkkk...",
];

export const PALETA_NUVEM_ROSA: Paleta = {
  a: "#F9A8D4",
  b: "#E879B8",
};

/* O dourado é usado com parcimônia: sobre o roxo do céu, uma nuvem inteira
   dourada com sombra escura vira mancha marrom. Aqui a sombra é um dourado
   mais quente, nunca um tom terroso. */
export const PALETA_NUVEM_OURO: Paleta = {
  a: "#FBBF24",
  b: "#E8A317",
};

/** Nuvem larga. Cantos em degrau dos dois lados — nuvem pixel não é caixa. */
export const NUVEM_LARGA = [
  "......aaaa......",
  "....aaaaaaaa....",
  "..aaaaaaaaaaaa..",
  ".aaaaaaaaaaaaaa.",
  "aaaaaaaaaaaaaaaa",
  ".bbbbbbbbbbbbbb.",
];

/** Nuvem pequena, para as camadas de fundo. */
export const NUVEM_PEQUENA = [
  "..aaaa..",
  ".aaaaaa.",
  "aaaaaaaa",
  ".bbbbbb.",
];

/** Cintilação de quatro pontas. */
export const ESTRELA = [
  "..y..",
  "..y..",
  "yyyyy",
  "..y..",
  "..y..",
];

/** Losango — misturado com a de quatro pontas para o céu não virar uma
    fileira de sinais de mais repetidos. */
export const ESTRELA_LOSANGO = [
  "..y..",
  ".yyy.",
  "yyyyy",
  ".yyy.",
  "..y..",
];

export const PALETA_ESTRELA: Paleta = { y: "#FBBF24" };
export const PALETA_ESTRELA_CLARA: Paleta = { y: "#F5F1EA" };
