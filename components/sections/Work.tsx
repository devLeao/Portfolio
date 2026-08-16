"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLocale } from "@/components/providers/LocaleProvider";
import { projects, projectsSection } from "@/content/content";
import { useHasHover, useIsMobile } from "@/lib/hooks";
import { usePrefersReducedMotion } from "@/components/providers/MotionProvider";

/**
 * Lista numerada de projetos.
 *
 * No desktop, cada linha é uma tipografia grande e o preview segue o cursor
 * com lerp. No mobile o mesmo dado vira card empilhado com a imagem visível —
 * "hover" não existe no toque, e esconder a imagem atrás de um gesto que
 * ninguém pode fazer seria esconder o portfólio inteiro.
 *
 * LAYOUT decide por LARGURA; o preview decide por capacidade de hover. Amarrar
 * as duas coisas ao hover quebrava em notebook com tela sensível ao toque: o
 * aparelho reporta ponteiro grosso, e uma tela de 1440px recebia os cards
 * empilhados com imagens gigantes.
 */
export default function Work() {
  const { t } = useLocale();
  const temHover = useHasHover();
  const compacto = useIsMobile();
  const reduzido = usePrefersReducedMotion();

  const [ativo, setAtivo] = useState<string | null>(null);
  const preview = useRef<HTMLDivElement>(null);
  const raiz = useRef<HTMLElement>(null);

  /** O preview persegue o ponteiro por lerp, num rAF só para a seção toda. */
  useEffect(() => {
    if (!temHover || reduzido) return;
    const caixa = preview.current;
    const secao = raiz.current;
    if (!caixa || !secao) return;

    const alvo = { x: 0, y: 0 };
    const atual = { x: 0, y: 0 };
    let iniciado = false;
    let raf = 0;

    const mover = (e: PointerEvent) => {
      const r = secao.getBoundingClientRect();
      alvo.x = e.clientX - r.left;
      alvo.y = e.clientY - r.top;
      // Primeiro movimento sem interpolação: começar do canto e "voar" até o
      // cursor entrega o truque.
      if (!iniciado) {
        atual.x = alvo.x;
        atual.y = alvo.y;
        iniciado = true;
      }
    };

    const quadro = () => {
      atual.x += (alvo.x - atual.x) * 0.13;
      atual.y += (alvo.y - atual.y) * 0.13;
      caixa.style.transform = `translate3d(${atual.x}px, ${atual.y}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(quadro);
    };

    secao.addEventListener("pointermove", mover);
    raf = requestAnimationFrame(quadro);

    return () => {
      secao.removeEventListener("pointermove", mover);
      cancelAnimationFrame(raf);
    };
  }, [temHover, reduzido]);

  const mostrarPreview = temHover && !compacto && !reduzido;

  return (
    <section id="projetos" ref={raiz} className="section shell relative">
      <div className="mb-12 flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="display-xl m-0 text-bone">{t(projectsSection.title)}</h2>
        <p className="label">{t(projectsSection.note)}</p>
      </div>

      {/* ---------- preview que segue o cursor (só desktop) ---------- */}
      {mostrarPreview ? (
        <div
          ref={preview}
          aria-hidden="true"
          data-visivel={Boolean(ativo)}
          className="pointer-events-none absolute left-0 top-0 z-10 w-[clamp(260px,26vw,420px)] scale-90 opacity-0 blur-sm transition-[opacity,transform,filter] duration-500 data-[visivel=true]:scale-100 data-[visivel=true]:opacity-100 data-[visivel=true]:blur-0"
        >
          <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-hairline bg-surface">
            {projects.map((p) => (
              <Image
                key={p.id}
                src={p.image}
                alt=""
                fill
                sizes="420px"
                data-on={ativo === p.id}
                className="object-cover object-top opacity-0 transition-opacity duration-300 data-[on=true]:opacity-100"
              />
            ))}
          </div>
        </div>
      ) : null}

      <ol className="m-0 list-none border-t border-hairline p-0">
        {projects.map((projeto) => (
          <li key={projeto.id} className="border-b border-hairline">
            <a
              href={projeto.href}
              target="_blank"
              rel="noopener noreferrer"
              onPointerEnter={() => setAtivo(projeto.id)}
              onPointerLeave={() => setAtivo((a) => (a === projeto.id ? null : a))}
              onFocus={() => setAtivo(projeto.id)}
              onBlur={() => setAtivo((a) => (a === projeto.id ? null : a))}
              data-on={ativo === projeto.id}
              className="group grid gap-4 py-7 no-underline transition-colors md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-8 md:py-8"
            >
              <span className="label tnum">{projeto.index}</span>

              <span className="flex flex-col gap-2">
                <span className="display-lg text-[1.75rem] leading-tight text-bone transition-[color,transform] duration-300 group-hover:text-iris md:text-[2.5rem] md:group-hover:translate-x-3">
                  {projeto.name}
                </span>
                <span className="max-w-[60ch] text-[0.9375rem] leading-relaxed text-muted">
                  {t(projeto.blurb)}
                </span>

                {/* Imagem no card compacto: sem hover, o preview não existe.
                    Limitada a 28rem — solta, ela vira um pôster de 1200px em
                    telas largas sem ponteiro fino. */}
                {compacto ? (
                  <span className="relative mt-2 block aspect-[16/10] w-full max-w-[28rem] overflow-hidden rounded-lg border border-hairline">
                    <Image
                      src={projeto.image}
                      alt={projeto.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 448px"
                      className="object-cover object-top"
                    />
                  </span>
                ) : null}
              </span>

              <span className="flex items-center gap-4">
                <span className="label tnum">{projeto.year}</span>
                <span
                  aria-hidden="true"
                  className="text-muted transition-[color,transform] duration-300 group-hover:translate-x-1 group-hover:text-iris"
                >
                  ↗
                </span>
              </span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
