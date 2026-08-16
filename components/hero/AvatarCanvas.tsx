"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Canvas } from "@react-three/fiber";
import Invalidar from "@/components/three/Invalidar";
import AjustarCameraAvatar from "@/components/hero/AjustarCameraAvatar";
import { useInViewport, useScrollProgress, useTabVisible } from "@/lib/hooks";
import { usePrefersReducedMotion } from "@/components/providers/MotionProvider";

/**
 * O canvas do avatar.
 *
 * Este arquivo importa `@react-three/fiber`, então ele NUNCA deve ser
 * importado de forma estática por uma seção — quem o usa é o `AvatarMount`,
 * via `next/dynamic`, e só quando a caixa chega perto da viewport.
 *
 * Fora da viewport o loop vai para `demand` — zero quadro gasto, mas ainda
 * (não só a animação) quando o canvas sai da tela, e a aba escondida conta
 * como fora da tela.
 *
 * Com movimento reduzido a cena desenha UM quadro e congela. Continua bonita,
 * para de se mexer.
 */

const AvatarScene = dynamic(() => import("@/components/hero/AvatarScene"), {
  ssr: false,
});

export default function AvatarCanvas() {
  const [ref, naTela] = useInViewport<HTMLDivElement>("120px");
  const abaVisivel = useTabVisible();
  const reduzido = usePrefersReducedMotion();
  const progresso = useScrollProgress();

  const ativo = naTela && abaVisivel && !reduzido;

  return (
    <div ref={ref} className="absolute inset-0">
      <Suspense fallback={null}>
        <Canvas
          aria-hidden="true"
          frameloop={ativo ? "always" : "demand"}
          dpr={[1, 1.75]}
          /* Só o primeiro quadro: quem manda no recuo é o `AjustarCameraAvatar`,
             que mede a caixa e afasta a câmera até a mesa caber. Valor fixo
             cortava o monitor em qualquer tela alta — ver a nota lá. */
          camera={{ position: [1.28, 0.66, 3.55], fov: 31 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        >
          <AjustarCameraAvatar />
          <Invalidar quando={ativo} />
          <AvatarScene ativo={ativo} progresso={progresso} />
        </Canvas>
      </Suspense>
    </div>
  );
}
