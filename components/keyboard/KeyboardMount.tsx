"use client";

import dynamic from "next/dynamic";
import LazyCanvas from "@/components/three/LazyCanvas";

/** Sem nenhum import do three: é isto que mantém a biblioteca fora do
    primeiro carregamento. Ver a nota em `LazyCanvas`. */
const KeyboardCanvas = dynamic(() => import("@/components/keyboard/KeyboardCanvas"), {
  ssr: false,
});

function Esqueleto() {
  return (
    <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
      <div className="motion-ambient h-[45%] w-[85%] animate-pulse rounded-xl bg-surface/60" />
    </div>
  );
}

export default function KeyboardMount({
  className = "",
  ...props
}: {
  className?: string;
  fileiras: number;
  ativoId: string | null;
  destacadoId: string | null;
  onSelecionar: (id: string) => void;
  onEntrar: (id: string) => void;
  onSair: (id: string) => void;
  secao: React.RefObject<HTMLElement | null>;
}) {
  return (
    <LazyCanvas className={className} esqueleto={<Esqueleto />} margem="1200px">
      <KeyboardCanvas {...props} />
    </LazyCanvas>
  );
}
