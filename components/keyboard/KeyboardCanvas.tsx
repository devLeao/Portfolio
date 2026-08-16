"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Canvas } from "@react-three/fiber";
import Invalidar from "@/components/three/Invalidar";
import EntradaNoScroll from "@/components/keyboard/EntradaNoScroll";
import { useInViewport, useTabVisible } from "@/lib/hooks";
import { usePrefersReducedMotion } from "@/components/providers/MotionProvider";

const KeyboardScene = dynamic(() => import("@/components/keyboard/KeyboardScene"), {
  ssr: false,
});

/**
 * O canvas do teclado.
 *
 * Importa `@react-three/fiber`, então quem o carrega é o `KeyboardMount` via
 * `next/dynamic`, nunca uma seção diretamente — ver a nota em `LazyCanvas`.
 *
 * Com movimento reduzido a cena vai para `demand`: continua clicável e
 * respondendo ao teclado físico — o cap ainda afunda porque o React pede o
 * quadro —, só não fica animando sozinha.
 */
export default function KeyboardCanvas({
  fileiras,
  ativoId,
  destacadoId,
  onSelecionar,
  onEntrar,
  onSair,
  secao,
}: {
  fileiras: number;
  ativoId: string | null;
  destacadoId: string | null;
  onSelecionar: (id: string) => void;
  onEntrar: (id: string) => void;
  onSair: (id: string) => void;
  /** Seção que governa a animação de entrada do teclado. */
  secao: React.RefObject<HTMLElement | null>;
}) {
  /* 500px e não 150: o laço precisa estar rodando ANTES de a placa aparecer,
     senão o primeiro quadro visível é o de uma cena que acabou de acordar. */
  const [ref, naTela] = useInViewport<HTMLDivElement>("500px");
  const abaVisivel = useTabVisible();
  const reduzido = usePrefersReducedMotion();

  const ativo = naTela && abaVisivel && !reduzido;

  return (
    <div ref={ref} className="absolute inset-0">
      <Suspense fallback={null}>
        <Canvas
          aria-hidden="true"
          frameloop={ativo ? "always" : "demand"}
          dpr={[1, 1.75]}
          /*
           * Posição inicial só para o primeiro quadro: quem manda no recuo é
           * o `AjustarCamera` da cena, que mede o canvas e recua até a placa
           * caber. Valor fixo cortava o teclado nas laterais em 375px.
           */
          camera={{ position: [0, 2.9, 3.4], fov: 30 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        >
          <Invalidar quando={ativo} />
          <EntradaNoScroll alvo={secao} reduzido={reduzido}>
            <KeyboardScene
              ativo={ativo}
              ativoId={ativoId}
              destacadoId={destacadoId}
              fileiras={fileiras}
              onSelecionar={onSelecionar}
              onEntrar={onEntrar}
              onSair={onSair}
            />
          </EntradaNoScroll>
        </Canvas>
      </Suspense>
    </div>
  );
}
