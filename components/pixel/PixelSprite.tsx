"use client";

import { useMemo } from "react";
import type { Paleta } from "@/components/pixel/sprites";

/**
 * Desenha um bitmap como SVG: um `<rect>` por pixel aceso.
 *
 * `shapeRendering="crispEdges"` desliga o antialias — sem isso, um sprite
 * escalado 8× ganha borda cinza e deixa de ser pixel art.
 *
 * Pixels da mesma cor em sequência viram um retângulo só. Num gato de 16×13
 * isso derruba ~160 nós para ~50, e o mundo pixel tem vários sprites na tela
 * ao mesmo tempo.
 */
export default function PixelSprite({
  bitmap,
  paleta,
  className = "",
  style,
  title,
}: {
  bitmap: string[];
  paleta: Paleta;
  className?: string;
  /** Posição e atraso sorteados no céu — não dá para virar utilitária. */
  style?: React.CSSProperties;
  /** Quando ausente, o sprite é decorativo e sai da árvore de acessibilidade. */
  title?: string;
}) {
  const largura = bitmap[0]?.length ?? 0;
  const altura = bitmap.length;

  const barras = useMemo(() => {
    const saida: { x: number; y: number; w: number; cor: string }[] = [];

    bitmap.forEach((linha, y) => {
      let x = 0;
      while (x < linha.length) {
        const c = linha[x];
        if (!c || c === ".") {
          x += 1;
          continue;
        }
        let fim = x;
        while (fim + 1 < linha.length && linha[fim + 1] === c) fim += 1;
        const cor = paleta[c];
        if (cor) saida.push({ x, y, w: fim - x + 1, cor });
        x = fim + 1;
      }
    });

    return saida;
  }, [bitmap, paleta]);

  return (
    <svg
      viewBox={`0 0 ${largura} ${altura}`}
      shapeRendering="crispEdges"
      className={className}
      style={style}
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {barras.map((b, i) => (
        <rect key={i} x={b.x} y={b.y} width={b.w} height={1} fill={b.cor} />
      ))}
    </svg>
  );
}
