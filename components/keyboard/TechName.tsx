"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePrefersReducedMotion } from "@/components/providers/MotionProvider";

/**
 * O nome da tecnologia em texto extrudado, à esquerda do teclado.
 *
 * ---------- por que NÃO é geometria 3D ----------
 * `Text3D` do drei precisa de uma fonte convertida em JSON (~200KB embarcados
 * só para ganhar chanfro), e `<Text>` do troika precisa de um TTF hospedado —
 * woff2, que é o que o next/font entrega, ele não lê. Nos dois casos eu
 * pagaria uma fonte inteira a mais e ainda teria texto rasterizado pela
 * resolução do canvas.
 *
 * Aqui a extrusão é feita com camadas de `text-shadow` na cor da marca,
 * escurecendo a cada passo, dentro de um `perspective` + `rotateY` reais. O
 * resultado tem a mesma leitura de volume, fica nítido em qualquer DPR, usa a
 * Fraunces que já está carregada, e o leitor de tela lê o nome — coisa que
 * texto dentro de canvas nunca permite.
 */

/** Escurece um hex por um fator 0..1. Alimenta as camadas da extrusão. */
function escurecer(hex: string, fator: number): string {
  const limpo = hex.replace("#", "");
  const n = parseInt(
    limpo.length === 3 ? limpo.split("").map((c) => c + c).join("") : limpo,
    16
  );
  const r = Math.round((((n >> 16) & 255) * fator));
  const g = Math.round((((n >> 8) & 255) * fator));
  const b = Math.round(((n & 255) * fator));
  return `rgb(${r} ${g} ${b})`;
}

/** Luminância relativa aproximada, 0..1. */
function luz(hex: string): number {
  const limpo = hex.replace("#", "");
  const n = parseInt(
    limpo.length === 3 ? limpo.split("").map((c) => c + c).join("") : limpo,
    16
  );
  return (
    (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  );
}

/** Pilha de sombras que simula a lateral extrudada da letra. */
function extrusao(hex: string, camadas: number): string {
  const partes: string[] = [];
  for (let i = 1; i <= camadas; i += 1) {
    // A face lateral escurece rápido no começo e desacelera — é assim que a
    // luz cai numa quina real.
    const fator = Math.max(0.12, 0.62 - (i / camadas) * 0.5);
    partes.push(`${i}px ${i}px 0 ${escurecer(hex, fator)}`);
  }
  return partes.join(", ");
}

export default function TechName({
  nome,
  tagline,
  hex,
  ocioso = false,
}: {
  nome: string;
  tagline: string;
  hex: string;
  /** Estado neutro: menor e sem cor de marca. */
  ocioso?: boolean;
}) {
  const raiz = useRef<HTMLDivElement>(null);
  const reduzido = usePrefersReducedMotion();

  /*
   * Next.js, Three.js e Vercel são marcas pretas. Pintar o nome com a cor da
   * marca sobre um fundo quase preto dava texto invisível — o cap resolve
   * isso levantando o corpo para grafite, mas tipografia não tem esse luxo.
   * Aqui a face vai para o bege do site e a extrusão pega um cinza médio,
   * que é o que preserva o volume sem a letra sumir.
   */
  const escura = useMemo(() => luz(hex) < 0.24, [hex]);
  const corFace = escura ? "#F5F1EA" : hex;
  const corVolume = escura ? "#4A4A57" : hex;

  const sombra = useMemo(
    () => extrusao(corVolume, ocioso ? 10 : 18),
    [corVolume, ocioso]
  );

  /** Entra girando em Y. Cada troca de tecnologia refaz a entrada. */
  useEffect(() => {
    if (reduzido) return;
    const el = raiz.current;
    if (!el) return;

    let cancelado = false;
    let ctx: { revert: () => void } | undefined;

    (async () => {
      const { default: gsap } = await import("gsap");
      if (cancelado) return;

      ctx = gsap.context(() => {
        gsap.fromTo(
          el.querySelectorAll("[data-gira]"),
          { rotateY: -46, opacity: 0, x: -28 },
          {
            rotateY: 0,
            opacity: 1,
            x: 0,
            duration: 0.72,
            ease: "power3.out",
            stagger: 0.07,
          }
        );
      }, el);
    })();

    return () => {
      cancelado = true;
      ctx?.revert();
    };
  }, [nome, reduzido]);

  return (
    <div
      ref={raiz}
      // A perspectiva mora no pai: aplicada em cada filho, cada linha teria
      // seu próprio ponto de fuga e as duas brigariam.
      style={{ perspective: "900px", perspectiveOrigin: "0% 50%" }}
      className="select-none"
    >
      <p
        data-gira
        aria-live="polite"
        style={{
          color: corFace,
          textShadow: sombra,
          transform: "rotateY(-15deg) rotateX(7deg)",
          transformStyle: "preserve-3d",
        }}
        className={`display-xl m-0 origin-left break-words ${
          ocioso
            ? "text-[clamp(2rem,4.5vw,3.5rem)] opacity-70"
            : "text-[clamp(2.5rem,6.5vw,5.25rem)]"
        }`}
      >
        {nome}
      </p>

      <p
        data-gira
        style={{
          transform: "rotateY(-15deg) rotateX(7deg)",
          transformStyle: "preserve-3d",
        }}
        className={`mt-5 max-w-[36ch] origin-left text-balance ${
          ocioso ? "text-muted" : "text-bone"
        } text-[clamp(0.9375rem,1.25vw,1.125rem)] leading-snug`}
      >
        {tagline}
      </p>
    </div>
  );
}
