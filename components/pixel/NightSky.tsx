"use client";

import { useMemo } from "react";
import PixelSprite from "@/components/pixel/PixelSprite";
import { useInViewport } from "@/lib/hooks";
import {
  ESTRELA,
  ESTRELA_LOSANGO,
  NUVEM_LARGA,
  NUVEM_PEQUENA,
  PALETA_ESTRELA,
  PALETA_ESTRELA_CLARA,
  PALETA_NUVEM_ROSA,
} from "@/components/pixel/sprites";

/**
 * Céu do mundo pixel: nuvens em três camadas de parallax e estrelas piscando.
 *
 * As posições são sorteadas UMA vez com semente fixa, não a cada render — céu
 * que se reorganiza a cada re-render é o tipo de coisa que ninguém aponta mas
 * todo mundo sente. E semente fixa também significa servidor e cliente
 * gerando o mesmo céu, sem erro de hidratação.
 */

/** PRNG determinístico: mesma semente, mesmo céu. */
function semente(n: number) {
  let s = n;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/*
 * Opacidade alta na camada da frente é o que faz o rosa LER como rosa. Nas
 * primeiras tentativas as três camadas ficaram entre 0,2 e 0,6 e todas as
 * nuvens viraram o mesmo malva sujo contra o roxo do céu.
 */
const CAMADAS = [
  { escala: "w-20 md:w-32", opacidade: 0.3, qtd: 4, larga: false },
  { escala: "w-28 md:w-48", opacidade: 0.55, qtd: 3, larga: false },
  { escala: "w-40 md:w-64", opacidade: 0.9, qtd: 3, larga: true },
] as const;

/**
 * `nuvens` e `estrelas` existem porque as duas se comportam de forma
 * diferente perto de texto: estrela é um ponto de 8px e não atrapalha nada,
 * nuvem é uma mancha de 250px que engole um título. Num quadro de 375px o
 * "SIDE QUESTS" nasceu em cima de uma nuvem dourada e sumiu.
 *
 * Então: estrelas por toda a seção, nuvens só onde não há o que ler.
 */
export default function NightSky({
  className = "",
  nuvens: comNuvens = true,
  estrelas: comEstrelas = true,
}: {
  className?: string;
  nuvens?: boolean;
  estrelas?: boolean;
}) {
  const nuvens = useMemo(() => {
    const rnd = semente(20260814);
    return CAMADAS.flatMap((camada, ci) =>
      Array.from({ length: camada.qtd }, (_, i) => ({
        id: `${ci}-${i}`,
        camada,
        /*
         * Nuvem só na faixa de cima e nas laterais. Atravessando o meio, ela
         * passa por trás do título e do texto e derruba a legibilidade — que
         * é exatamente o que aconteceu na primeira versão.
         */
        top: 2 + rnd() * 26,
        /*
         * Posição do CENTRO da nuvem, não da borda esquerda.
         *
         * Antes isto era `left` puro, limitado a 78% para a nuvem não sair
         * cortada. Só que `left` posiciona a BORDA: uma nuvem de 256px em
         * 78% de 1366 termina em 97%, mas as que caíam em colunas baixas
         * terminavam bem antes do meio — e o conjunto ficava encostado à
         * esquerda, com um vazio na direita.
         *
         * Agora cada nuvem nasce no centro da sua coluna (`(i + 0,5) / qtd`)
         * e é puxada meia largura para trás por `translateX(-50%)` no JSX.
         * A faixa fica simétrica em qualquer largura de tela, e o empurrão
         * aleatório de ±um terço da coluna evita a fileira alinhada.
         */
        left: ((i + 0.5) / camada.qtd) * 100 + (rnd() - 0.5) * (100 / camada.qtd) * 0.66,
        atraso: rnd() * 5,
      }))
    );
  }, []);

  const estrelas = useMemo(() => {
    const rnd = semente(777);
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      top: rnd() * 92,
      left: rnd() * 96,
      tamanho: 4 + Math.round(rnd() * 8),
      atraso: rnd() * 3,
      losango: rnd() > 0.55,
      clara: rnd() > 0.6,
    }));
  }, []);

  /*
   * O céu só existe quando está chegando perto.
   *
   * São quatro instâncias deste componente numa página de 12.000px, e cada
   * uma solta ~40 sprites SVG. Renderizadas de saída, viravam ~2.000 nós no
   * DOM ANTES de qualquer rolagem — e cada `ScrollTrigger` que se registra
   * depois tem que medir esse documento inteiro. No Lighthouse isso aparecia
   * como uma tarefa de 1,6s vinda de um pedaço de 20KB: não era o parse do
   * script, era o layout que ele provocava.
   *
   * Como tudo aqui é decoração, não renderizar cedo não custa nada a ninguém.
   */
  const [ref, perto] = useInViewport<HTMLDivElement>("500px");

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none overflow-hidden ${className}`}
    >
      {(perto && comEstrelas ? estrelas : []).map((e) => (
        <PixelSprite
          key={e.id}
          bitmap={e.losango ? ESTRELA_LOSANGO : ESTRELA}
          paleta={e.clara ? PALETA_ESTRELA_CLARA : PALETA_ESTRELA}
          className="motion-ambient absolute animate-[twinkle_3s_ease-in-out_infinite]"
          style={{
            top: `${e.top}%`,
            left: `${e.left}%`,
            width: `${e.tamanho}px`,
            animationDelay: `${e.atraso}s`,
          }}
        />
      ))}

      {(perto && comNuvens ? nuvens : []).map((n) => (
        /*
         * Duas camadas de propósito.
         *
         * A de fora POSICIONA: `left` no centro da coluna e `translateX(-50%)`
         * puxando meia largura para trás. A de dentro ANIMA a flutuação.
         *
         * Juntar as duas quebra: os keyframes de `float` escrevem `transform`
         * inteiro, apagariam o `translateX(-50%)`, e cada nuvem saltaria meia
         * largura para a direita no primeiro quadro da animação.
         */
        <div
          key={n.id}
          className={`absolute ${n.camada.escala}`}
          style={{
            top: `${n.top}%`,
            left: `${n.left}%`,
            transform: "translateX(-50%)",
            opacity: n.camada.opacidade,
          }}
        >
          <div
            className="motion-ambient animate-[float_6s_ease-in-out_infinite]"
            style={{ animationDelay: `${n.atraso}s` }}
          >
            {/* Só rosa. A variante dourada foi retirada: sobre o roxo do céu
                ela puxava para marrom e lia como mancha, não como nuvem. */}
            <PixelSprite
              bitmap={n.camada.larga ? NUVEM_LARGA : NUVEM_PEQUENA}
              paleta={PALETA_NUVEM_ROSA}
              className="w-full"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
