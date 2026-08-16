"use client";

/**
 * Canal entre o DOM e o avatar 3D.
 *
 * O avatar precisa saber de coisas que acontecem longe dele: o mouse rondando
 * o hero, o cursor parando em cima do botão do GitHub, alguém apertando `R` na
 * seção Skills lá embaixo, o formulário de contato enviando.
 *
 * Passar isso por props ou contexto forçaria um re-render do React a cada
 * movimento do mouse — sessenta re-renders por segundo numa árvore que tem
 * um canvas WebGL dentro. Aqui os valores contínuos vivem em objetos mutáveis
 * que o `useFrame` LÊ, sem re-render nenhum, e o que é pontual vira evento.
 *
 * Módulo singleton em vez de contexto também resolve a fronteira do
 * `next/dynamic`: quem emite (Hero, Skills, Contact) e quem escuta (a cena)
 * estão em pedaços de bundle diferentes.
 */

export type EventoAvatar =
  | { tipo: "acenar" }
  /** Alguém apertou uma tecla no teclado 3D — ele digita junto, mais rápido. */
  | { tipo: "digitar" }
  /** Derrubou o café. Ele para, não entende, nega com a cabeça e volta. */
  | { tipo: "confuso" }
  | { tipo: "sorrir" };

type Ouvinte = (evento: EventoAvatar) => void;

const ouvintes = new Set<Ouvinte>();

export const avatarBus = {
  /**
   * Ponteiro normalizado na viewport, -1..1 nos dois eixos. `y` já vem
   * invertido para bater com o sentido do 3D (para cima é positivo).
   */
  ponteiro: { x: 0, y: 0 },

  /** `true` enquanto o cursor está sobre algum CTA do hero. */
  ctaAtivo: false,

  /**
   * Posição do CTA em foco, também em -1..1. É para onde ele olha — sem isso
   * ele só saberia QUE tem um botão em foco, não ONDE.
   */
  ctaPos: { x: 0, y: 0 },

  emitir(evento: EventoAvatar) {
    for (const fn of ouvintes) fn(evento);
  },

  ouvir(fn: Ouvinte) {
    ouvintes.add(fn);
    return () => {
      ouvintes.delete(fn);
    };
  },
};

let ligado = false;

/**
 * Começa a rastrear o ponteiro. Idempotente: qualquer componente pode chamar,
 * o listener é registrado uma vez só e nunca é removido — ele vive enquanto a
 * página viver, e custa duas divisões por evento.
 */
export function ligarPonteiro() {
  if (ligado || typeof window === "undefined") return;
  ligado = true;

  window.addEventListener(
    "pointermove",
    (e) => {
      avatarBus.ponteiro.x = (e.clientX / window.innerWidth) * 2 - 1;
      avatarBus.ponteiro.y = -((e.clientY / window.innerHeight) * 2 - 1);
    },
    { passive: true }
  );
}

/** Converte um elemento do DOM em coordenada -1..1 para o avatar olhar. */
export function focarElemento(el: Element) {
  const r = el.getBoundingClientRect();
  avatarBus.ctaPos.x = ((r.left + r.width / 2) / window.innerWidth) * 2 - 1;
  avatarBus.ctaPos.y = -(((r.top + r.height / 2) / window.innerHeight) * 2 - 1);
  avatarBus.ctaAtivo = true;
}

export function desfocar() {
  avatarBus.ctaAtivo = false;
}
