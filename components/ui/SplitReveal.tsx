"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/components/providers/MotionProvider";

/**
 * Reveal por máscara, palavra a palavra ou linha a linha.
 *
 * A armadilha clássica aqui é o texto sair empilhado, uma palavra por linha.
 * Duas causas, as duas tratadas:
 *
 * 1. O `display` das palavras. `.word` e `.word-inner` são `inline-block` em
 *    CSS próprio (globals.css), fora do alcance de qualquer utilitária.
 * 2. O espaço entre as palavras. JSX come whitespace entre elementos, então
 *    o espaço é um nó de texto explícito, FORA da máscara — dentro dela o
 *    `overflow:hidden` o engoliria junto.
 *
 * O container fica `visibility:hidden` até o GSAP montar, com trava de 1,2s:
 * se o import falhar, o texto aparece mesmo assim. Texto invisível por causa
 * de animação quebrada é pior do que texto sem animação.
 */

type Props = {
  text: string;
  as?: "p" | "h2" | "h3" | "span" | "div";
  mode?: "word" | "line";
  delay?: number;
  stagger?: number;
  className?: string;
  /** Dispara no scroll em vez de no load. */
  trigger?: boolean;
};

export default function SplitReveal({
  text,
  as: Tag = "p",
  mode = "word",
  delay = 0,
  stagger = 0.035,
  className = "",
  trigger = true,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const reduzido = usePrefersReducedMotion();

  useEffect(() => {
    const raiz = ref.current;
    if (!raiz) return;

    if (reduzido) {
      raiz.removeAttribute("data-armed");
      return;
    }

    // Trava de segurança: aconteça o que acontecer, o texto aparece.
    const trava = window.setTimeout(() => raiz.removeAttribute("data-armed"), 1200);

    let ctx: { revert: () => void } | undefined;
    let cancelado = false;

    (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelado) return;

      gsap.registerPlugin(ScrollTrigger);
      window.clearTimeout(trava);
      raiz.removeAttribute("data-armed");

      ctx = gsap.context(() => {
        const alvos = raiz.querySelectorAll(".word-inner");
        gsap.fromTo(
          alvos,
          { yPercent: 108 },
          {
            yPercent: 0,
            duration: 0.95,
            ease: "expo.out",
            stagger,
            delay,
            ...(trigger
              ? { scrollTrigger: { trigger: raiz, start: "top 85%", once: true } }
              : {}),
          }
        );
      }, raiz);
    })();

    return () => {
      cancelado = true;
      window.clearTimeout(trava);
      ctx?.revert();
    };
  }, [reduzido, delay, stagger, trigger, text]);

  const pedacos = mode === "word" ? text.split(" ") : text.split("\n");

  return (
    <Tag
      ref={ref as React.Ref<never>}
      data-armed="true"
      className={`split ${className}`}
    >
      {pedacos.map((pedaco, i) => (
        // O fragmento carrega a palavra E o espaço que vem depois dela. O
        // espaço fica fora do `.word` de propósito: dentro, some no overflow.
        <span key={`${pedaco}-${i}`}>
          <span className="word">
            <span className="word-inner">{pedaco}</span>
          </span>
          {i < pedacos.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  );
}
