"use client";

import dynamic from "next/dynamic";
import LazyCanvas from "@/components/three/LazyCanvas";

/** Sem nenhum import do three: é isto que mantém a biblioteca fora do
    primeiro carregamento. Ver a nota em `LazyCanvas`. */
const AvatarCanvas = dynamic(() => import("@/components/hero/AvatarCanvas"), {
  ssr: false,
});

function Esqueleto() {
  return (
    <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
      <div className="motion-ambient h-2/3 w-2/3 animate-pulse rounded-2xl bg-surface/50" />
    </div>
  );
}

export default function AvatarMount({ className = "" }: { className?: string }) {
  return (
    <LazyCanvas className={className} esqueleto={<Esqueleto />} margem="600px">
      <AvatarCanvas />
    </LazyCanvas>
  );
}
