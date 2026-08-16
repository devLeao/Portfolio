/**
 * O que está escrito no monitor do avatar.
 *
 * Antes eram barras cinza representando "linhas de código". De perto, barra
 * é barra: o olho reconhece o truque na hora. Aqui é código de verdade —
 * TypeScript que poderia estar neste próprio repositório — desenhado com
 * fonte monoespaçada e cores de sintaxe.
 *
 * Cada linha vira uma lista de pedaços tipados, e o desenho no canvas apenas
 * concatena. Fazer o realce por regex a cada quadro seria caro e frágil.
 */

export type Token = { t: string; c: Cor };
export type Cor = "chave" | "tipo" | "func" | "texto" | "num" | "coment" | "puro";

export const CORES: Record<Cor, string> = {
  chave: "#C792EA", // roxo, como a paleta do site
  tipo: "#7FD1E8",
  func: "#82AAFF",
  texto: "#C3E88D",
  num: "#F78C6C",
  coment: "#5B6274",
  puro: "#B6BDCC",
};

const k = (t: string): Token => ({ t, c: "chave" });
const y = (t: string): Token => ({ t, c: "tipo" });
const f = (t: string): Token => ({ t, c: "func" });
const s = (t: string): Token => ({ t, c: "texto" });
const n = (t: string): Token => ({ t, c: "num" });
const c = (t: string): Token => ({ t, c: "coment" });
const p = (t: string): Token => ({ t, c: "puro" });

/** Indentação em espaços + os pedaços da linha. */
export type Linha = { ind: number; toks: Token[] };

export const CODIGO: Linha[] = [
  { ind: 0, toks: [c("// hero/AvatarScene.tsx")] },
  { ind: 0, toks: [k("export default function "), f("Avatar"), p("() {")] },
  { ind: 1, toks: [k("const "), p("[pose, setPose] = "), f("useState"), p("("), s("'trabalhando'"), p(")")] },
  { ind: 1, toks: [] },
  { ind: 1, toks: [f("useFrame"), p("((_, dt) => {")] },
  { ind: 2, toks: [k("if "), p("(!ativo) "), k("return")] },
  { ind: 2, toks: [p("tempo.current += dt")] },
  { ind: 2, toks: [] },
  { ind: 2, toks: [c("// olha para onde o mouse está")] },
  { ind: 2, toks: [k("const "), p("alvo = "), y("MathUtils"), p("."), f("clamp"), p("(")] },
  { ind: 3, toks: [p("bus.ponteiro.x * "), n("0.55"), p(", -"), n("0.85"), p(", "), n("0.75")] },
  { ind: 2, toks: [p(")")] },
  { ind: 2, toks: [p("cabeca.rotation.y = "), f("lerp"), p("(atual, alvo, "), n("0.07"), p(")")] },
  { ind: 1, toks: [p("})")] },
  { ind: 0, toks: [p("}")] },
  { ind: 0, toks: [] },
  { ind: 0, toks: [c("// keyboard/Keycap.tsx")] },
  { ind: 0, toks: [f("gsap"), p("."), f("to"), p("(cap.position, {")] },
  { ind: 1, toks: [p("y: -"), n("0.06"), p(",")] },
  { ind: 1, toks: [p("ease: "), s("'elastic.out(1, 0.3)'"), p(",")] },
  { ind: 1, toks: [p("duration: "), n("0.6")] },
  { ind: 0, toks: [p("})")] },
  { ind: 0, toks: [] },
  { ind: 0, toks: [c("// hero/Xicara.tsx")] },
  { ind: 0, toks: [k("if "), p("(inclinacao > "), n("0.42"), p(") ")] },
  { ind: 1, toks: [f("derramar"), p("()")] },
  { ind: 0, toks: [] },
  { ind: 0, toks: [k("const "), p("stack = ["), s("'ts'"), p(", "), s("'react'"), p(", "), s("'node'"), p("]")] },
  { ind: 0, toks: [p("stack."), f("forEach"), p("(t => "), f("render"), p("(t))")] },
];
