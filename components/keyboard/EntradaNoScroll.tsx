"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * O teclado entra crescendo e girando conforme a página rola.
 *
 * ---------- por que não GSAP direto no grupo ----------
 * Dava para amarrar um ScrollTrigger às propriedades do `THREE.Group`. Só que
 * o GSAP escreveria nelas fora do laço de render do R3F, e com o canvas em
 * `demand` (que é como ele fica fora da viewport) a mudança não chegaria a
 * virar quadro — o teclado ficaria congelado numa pose intermediária.
 *
 * Aqui o ScrollTrigger só atualiza um NÚMERO num ref, e o `useFrame` aplica.
 * Uma fonte de verdade, um único lugar escrevendo na cena, e o canvas decide
 * quando desenhar.
 *
 * O progresso vai de 0 (seção entrando por baixo) a 1 (centralizada):
 *   escala   0,62 → 1
 *   giro Y   −0,55 rad → −0,12 rad, a pose final de três quartos
 *   giro X   +0,22 rad → 0, como se a placa se deitasse na mesa
 */
export default function EntradaNoScroll({
  alvo,
  reduzido,
  children,
}: {
  /** Elemento cuja rolagem governa a animação — a seção Skills. */
  alvo: React.RefObject<HTMLElement | null>;
  reduzido: boolean;
  children: React.ReactNode;
}) {
  const grupo = useRef<THREE.Group>(null);
  const progresso = useRef(reduzido ? 1 : 0);
  const invalidate = useThree((e) => e.invalidate);

  useEffect(() => {
    if (reduzido) {
      progresso.current = 1;
      return;
    }

    const el = alvo.current;
    if (!el) return;

    let cancelado = false;
    let ctx: { revert: () => void } | undefined;

    (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelado) return;
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: el,
          start: "top bottom",
          end: "center center",
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            progresso.current = self.progress;
            /*
             * Pedir o quadro aqui é o que faz a entrada existir enquanto o
             * canvas ainda está em `demand` — que é justamente o estado dele
             * durante a maior parte desta animação, já que a seção está
             * entrando e ainda não disparou o `naTela` do KeyboardCanvas.
             *
             * Não é desperdício: este `onUpdate` só roda entre o `start` e o
             * `end` do trigger, ou seja, exatamente na janela em que o
             * teclado precisa desenhar.
             */
            invalidate();
          },
        });
      });
    })();

    return () => {
      cancelado = true;
      ctx?.revert();
    };
  }, [alvo, reduzido, invalidate]);

  useFrame(() => {
    const g = grupo.current;
    if (!g) return;

    // Suavização própria por cima do scrub: a rolagem do trackpad chega em
    // saltos, e sem o lerp a placa treme em vez de deslizar.
    const p = progresso.current;
    const escala = 0.62 + p * 0.38;
    g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, escala, 0.12));
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, -0.55 + p * 0.43, 0.12);
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, 0.22 * (1 - p), 0.12);
  });

  return <group ref={grupo}>{children}</group>;
}
