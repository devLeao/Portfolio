"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLocale } from "@/components/providers/LocaleProvider";
import {
  bookingClients,
  bookingSystem,
  projects,
  projectsSection,
  studies,
} from "@/content/content";
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
      <h2 className="display-xl m-0 mb-12 text-bone">{t(projectsSection.title)}</h2>

      <Agenda />

      <div className="mb-6 mt-24 flex flex-wrap items-baseline justify-between gap-4">
        <h3 className="display-lg m-0 text-[1.5rem] text-bone md:text-[1.75rem]">
          {t(projectsSection.sites)}
        </h3>
        <p className="label m-0">{t(projectsSection.sitesNote)}</p>
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
                      alt={projeto.alt ? t(projeto.alt) : projeto.name}
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

      <Estudos />
    </section>
  );
}

/**
 * Bloco de destaque: um sistema, três negócios. Os clientes viram cards com
 * imagem sempre visível — aqui a imagem é o argumento, não um enfeite de hover.
 * O selo de status é obrigatório: protótipo não pode passar por produção.
 */
function Agenda() {
  const { t } = useLocale();

  return (
    <div>
      <p className="label m-0 mb-3 text-iris-soft">{t(bookingSystem.tag)}</p>
      <h3 className="display-lg m-0 mb-6 text-[1.75rem] leading-tight text-bone md:text-[2.5rem]">
        {t(bookingSystem.title)}
      </h3>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
        <p className="m-0 max-w-[60ch] text-[1.0625rem] leading-relaxed text-bone/85">
          {t(bookingSystem.lead)}
        </p>
        <ul className="m-0 list-none p-0">
          {bookingSystem.features.map((f, i) => (
            <li
              key={i}
              className="mb-3 flex gap-3 text-[0.9375rem] leading-relaxed text-muted last:mb-0"
            >
              <span aria-hidden="true" className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-iris" />
              {t(f)}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 grid max-w-[78ch] gap-2 text-sm leading-relaxed text-muted">
        <p className="m-0">{t(bookingSystem.code)}</p>
        <p className="m-0">{t(bookingSystem.note)}</p>
      </div>

      <ul className="m-0 mt-10 grid list-none gap-6 p-0 md:grid-cols-3">
        {bookingClients.map((c) => (
          <li key={c.id}>
            <a
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-full flex-col overflow-hidden rounded-lg border border-hairline bg-surface no-underline transition-colors hover:border-iris"
            >
              <span className="relative block aspect-[16/10] overflow-hidden border-b border-hairline">
                <Image
                  src={c.image}
                  alt={t(c.alt)}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </span>
              <span className="flex flex-1 flex-col gap-2 p-5">
                <span className="flex flex-wrap items-center justify-between gap-2">
                  <span className="label tnum">
                    {t(c.segment)} · {c.year}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-[0.16em] ${
                      c.status === "live" ? "border-ok/40 text-ok" : "border-hairline text-muted"
                    }`}
                  >
                    {c.status === "live" ? (
                      <span aria-hidden="true" className="size-1.5 rounded-full bg-ok" />
                    ) : null}
                    {t(bookingSystem.status[c.status])}
                  </span>
                </span>
                <span className="flex items-baseline justify-between gap-3">
                  <span className="display-lg text-[1.375rem] leading-tight text-bone transition-colors group-hover:text-iris">
                    {c.name}
                  </span>
                  <span
                    aria-hidden="true"
                    className="text-muted transition-[color,transform] duration-300 group-hover:translate-x-1 group-hover:text-iris"
                  >
                    ↗
                  </span>
                </span>
                <span className="text-[0.9375rem] leading-relaxed text-muted">{t(c.blurb)}</span>
                <span className="mt-auto pt-2 font-mono text-[0.6875rem] text-muted">
                  {c.stack.join(" · ")}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Estudos: separados dos clientes, sem capa e com o rótulo à vista. */
function Estudos() {
  const { t } = useLocale();

  return (
    <div className="mt-24">
      <h3 className="display-lg m-0 mb-6 text-[1.5rem] text-bone md:text-[1.75rem]">
        {t(projectsSection.studies)}
      </h3>
      <ul className="m-0 list-none border-t border-hairline p-0">
        {studies.map((s) => (
          <li key={s.id} className="border-b border-hairline">
            <a
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group grid gap-2 py-6 no-underline md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-8"
            >
              <span className="flex flex-col gap-1.5">
                <span className="text-[1.25rem] leading-tight text-bone transition-colors group-hover:text-iris">
                  {s.name}
                </span>
                <span className="text-[0.9375rem] leading-relaxed text-muted">{t(s.label)}</span>
              </span>
              <span className="flex items-center gap-4">
                <span className="font-mono text-[0.6875rem] text-muted">{s.stack.join(" · ")}</span>
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
      </ul>
    </div>
  );
}
