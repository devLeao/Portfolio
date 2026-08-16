"use client";

import { useEffect } from "react";
import { usePrefersReducedMotion } from "@/components/providers/MotionProvider";

/**
 * Lenis + ScrollTrigger no mesmo relógio.
 *
 * Os dois precisam concordar sobre a posição do scroll: o Lenis interpola a
 * rolagem e o ScrollTrigger lê `scrollTop`. Sem o `scrollerProxy` e o tick
 * compartilhado, o portal (que é 100% scrub) dispara atrasado e treme.
 *
 * Com movimento reduzido o Lenis nem é instanciado — rolagem nativa é o que
 * a pessoa pediu ao ligar a preferência.
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduzido = usePrefersReducedMotion();

  useEffect(() => {
    if (reduzido) return;

    let limpar: (() => void) | undefined;
    let cancelado = false;

    (async () => {
      const [{ default: Lenis }, { default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("lenis"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelado) return;

      gsap.registerPlugin(ScrollTrigger);

      const lenis = new Lenis({
        duration: 1.05,
        easing: (x) => Math.min(1, 1.001 - 2 ** (-10 * x)),
        smoothWheel: true,
      });

      lenis.on("scroll", ScrollTrigger.update);

      const tick = (tempo: number) => lenis.raf(tempo * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      limpar = () => {
        gsap.ticker.remove(tick);
        lenis.destroy();
      };
    })();

    return () => {
      cancelado = true;
      limpar?.();
    };
  }, [reduzido]);

  return <>{children}</>;
}
