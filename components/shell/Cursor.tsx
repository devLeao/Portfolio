"use client";

import { useEffect, useRef, useState } from "react";
import { useHasHover } from "@/lib/hooks";
import { usePrefersReducedMotion } from "@/components/providers/MotionProvider";

/**
 * Cursor customizado: um ponto que segue o mouse, um anel que chega atrasado,
 * e um rastro neon que muda de cor conforme a mão anda.
 *
 * O rastro é desenhado num canvas 2D, não em divs. Vinte e oito nós de DOM
 * sendo reposicionados a cada quadro custam layout e composição; um canvas
 * custa um `clearRect` e um traço.
 *
 * A COR avança com a DISTÂNCIA percorrida, não com o relógio. Parado, o
 * rastro mantém a cor; movendo, ele varre o espectro. É o que faz o efeito
 * responder à mão em vez de ficar piscando sozinho.
 *
 * No mundo pixel ele troca de traje: as posições são grudadas numa grade de
 * 10px e viram quadrados chapados, sem suavização e sem degradê — a mesma
 * peça, obedecendo a estética da seção em que está.
 */

const MAX = 26;

export default function Cursor() {
  const pontoRef = useRef<HTMLDivElement>(null);
  const anelRef = useRef<HTMLCanvasElement>(null);
  const [ativo, setAtivo] = useState(false);
  const temHover = useHasHover();
  const reduzido = usePrefersReducedMotion();

  useEffect(() => {
    if (!temHover || reduzido) return;

    document.body.dataset.cursor = "on";
    setAtivo(true);

    const canvas = anelRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const redimensionar = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    redimensionar();

    const alvo = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const suave = { ...alvo };
    const trilha: { x: number; y: number; h: number }[] = [];
    let matiz = 265; // começa no roxo da paleta
    let raf = 0;

    const mover = (e: PointerEvent) => {
      const dx = e.clientX - alvo.x;
      const dy = e.clientY - alvo.y;
      // Matiz caminha com a distância: mexeu muito, mudou muito de cor.
      matiz = (matiz + Math.hypot(dx, dy) * 0.55) % 360;

      alvo.x = e.clientX;
      alvo.y = e.clientY;

      const el = e.target as HTMLElement | null;
      const clicavel = el?.closest("a, button, input, textarea, [data-cursor-grow]");
      pontoRef.current?.setAttribute("data-grow", String(Boolean(clicavel)));
    };

    const quadro = () => {
      suave.x += (alvo.x - suave.x) * 0.35;
      suave.y += (alvo.y - suave.y) * 0.35;

      trilha.push({ x: suave.x, y: suave.y, h: matiz });
      if (trilha.length > MAX) trilha.shift();

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const pixel = document.body.dataset.mundo === "pixel";

      if (pixel) {
        // Traje pixel: quadrados grudados na grade, sem antialias nem rabo
        // contínuo. Menos pontos, para não virar uma cobra.
        ctx.imageSmoothingEnabled = false;
        const grade = 10;
        for (let i = trilha.length - 1; i >= 0; i -= 2) {
          const p = trilha[i];
          if (!p) continue;
          const vida = i / trilha.length;
          const lado = Math.max(2, Math.round(grade * vida));
          ctx.globalAlpha = vida * 0.85;
          ctx.fillStyle = `hsl(${Math.round(p.h / 40) * 40} 90% 68%)`;
          ctx.fillRect(
            Math.round(p.x / grade) * grade - lado / 2,
            Math.round(p.y / grade) * grade - lado / 2,
            lado,
            lado
          );
        }
        ctx.globalAlpha = 1;
      } else {
        // Traje neon: traço que afina e um brilho por baixo.
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        for (let i = 1; i < trilha.length; i += 1) {
          const a = trilha[i - 1];
          const b = trilha[i];
          if (!a || !b) continue;
          const vida = i / trilha.length;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `hsl(${b.h} 95% 62% / ${vida * 0.75})`;
          ctx.lineWidth = vida * 5;
          ctx.shadowBlur = 14 * vida;
          ctx.shadowColor = `hsl(${b.h} 95% 62%)`;
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      }

      if (pontoRef.current) {
        pontoRef.current.style.transform = `translate3d(${alvo.x}px, ${alvo.y}px, 0) translate(-50%, -50%)`;
      }

      raf = requestAnimationFrame(quadro);
    };

    window.addEventListener("pointermove", mover, { passive: true });
    window.addEventListener("resize", redimensionar);
    raf = requestAnimationFrame(quadro);

    return () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("resize", redimensionar);
      cancelAnimationFrame(raf);
      delete document.body.dataset.cursor;
      setAtivo(false);
    };
  }, [temHover, reduzido]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[100]">
      <canvas ref={anelRef} className="absolute inset-0" />
      {ativo ? (
        <div
          ref={pontoRef}
          data-grow="false"
          className="absolute left-0 top-0 size-2 rounded-full bg-bone transition-[width,height] duration-200 data-[grow=true]:size-5 data-[grow=true]:bg-iris-soft"
        />
      ) : null}
    </div>
  );
}
