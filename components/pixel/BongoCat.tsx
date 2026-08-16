"use client";

import { useEffect, useState } from "react";
import PixelSprite from "@/components/pixel/PixelSprite";
import {
  GATO_BATE,
  GATO_LEVANTA,
  GATO_OLHA,
  PALETA_GATO,
} from "@/components/pixel/sprites";
import { usePrefersReducedMotion } from "@/components/providers/MotionProvider";

/**
 * O mascote da ponte.
 *
 * Um gato, três aparições: pequeno no rodapé do mundo dark olhando para cima,
 * grande e batendo pata no playground, e discreto de novo no rodapé geral.
 * É ele que costura os dois mundos — sem essa repetição, o lado pixel parece
 * um site diferente colado no fim da página.
 *
 * A batida não é intervalo fixo: patinha de verdade tem hesitação, e um
 * `setInterval` constante entrega o loop na primeira olhada.
 */
export default function BongoCat({
  modo = "bate",
  className = "",
  title,
}: {
  /** `bate` alterna as patas; `olha` é o quadro parado de olhar para cima. */
  modo?: "bate" | "olha";
  className?: string;
  title?: string;
}) {
  const reduzido = usePrefersReducedMotion();
  const [batendo, setBatendo] = useState(false);

  useEffect(() => {
    if (modo !== "bate" || reduzido) return;

    let timer: number;
    const agendar = () => {
      timer = window.setTimeout(() => {
        setBatendo((v) => !v);
        agendar();
      }, 190 + Math.random() * 320);
    };
    agendar();

    return () => window.clearTimeout(timer);
  }, [modo, reduzido]);

  const bitmap =
    modo === "olha" ? GATO_OLHA : batendo ? GATO_BATE : GATO_LEVANTA;

  return (
    <PixelSprite
      bitmap={bitmap}
      paleta={PALETA_GATO}
      className={className}
      title={title}
    />
  );
}
