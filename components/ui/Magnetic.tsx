"use client";

import { useEffect, useRef } from "react";
import { useHasHover } from "@/lib/hooks";
import { usePrefersReducedMotion } from "@/components/providers/MotionProvider";

/**
 * Efeito magnético: o filho é puxado na direção do ponteiro enquanto ele
 * ronda por perto, e volta com elástica ao sair.
 *
 * Sem hover fino ou com movimento reduzido, o wrapper vira um `<span>` que
 * não faz nada — o link continua funcionando igual.
 */
export default function Magnetic({
  children,
  forca = 0.35,
  className = "",
}: {
  children: React.ReactNode;
  /** 0 = imóvel, 1 = gruda no cursor. */
  forca?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const temHover = useHasHover();
  const reduzido = usePrefersReducedMotion();

  useEffect(() => {
    if (!temHover || reduzido) return;
    const el = ref.current;
    if (!el) return;

    let cancelado = false;
    let limpar: (() => void) | undefined;

    (async () => {
      const { default: gsap } = await import("gsap");
      if (cancelado) return;

      const mover = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        gsap.to(el, { x: dx * forca, y: dy * forca, duration: 0.5, ease: "power3.out" });
      };

      const sair = () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.35)" });
      };

      el.addEventListener("pointermove", mover);
      el.addEventListener("pointerleave", sair);

      limpar = () => {
        el.removeEventListener("pointermove", mover);
        el.removeEventListener("pointerleave", sair);
        gsap.killTweensOf(el);
      };
    })();

    return () => {
      cancelado = true;
      limpar?.();
    };
  }, [temHover, reduzido, forca]);

  return (
    <span ref={ref} className={`inline-block ${className}`}>
      {children}
    </span>
  );
}
