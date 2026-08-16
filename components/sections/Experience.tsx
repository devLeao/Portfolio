"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { experience, experienceSection } from "@/content/content";
import { usePrefersReducedMotion } from "@/components/providers/MotionProvider";

/**
 * Timeline vertical.
 *
 * A linha é um `<path>` SVG desenhado com `strokeDashoffset` amarrado ao
 * scroll. `drawSVG` do GSAP faz o mesmo, mas é plugin pago — e aqui a conta
 * é uma subtração: `offset = comprimento × (1 − progresso)`.
 */
export default function Experience() {
  const { t } = useLocale();
  const reduzido = usePrefersReducedMotion();
  const raiz = useRef<HTMLDivElement>(null);
  const traco = useRef<SVGLineElement>(null);

  useEffect(() => {
    const el = raiz.current;
    const linha = traco.current;
    if (!el || !linha) return;

    if (reduzido) {
      linha.style.strokeDashoffset = "0";
      el.querySelectorAll("[data-entrada]").forEach((n) => {
        (n as HTMLElement).style.opacity = "1";
        (n as HTMLElement).style.transform = "none";
      });
      return;
    }

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
        // O comprimento é lido do DOM: a linha acompanha a altura da lista,
        // que muda com o idioma e com a quebra de texto.
        const comprimento = linha.getTotalLength();
        gsap.set(linha, { strokeDasharray: comprimento, strokeDashoffset: comprimento });

        gsap.to(linha, {
          strokeDashoffset: 0,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top 72%",
            end: "bottom 78%",
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });

        gsap.fromTo(
          el.querySelectorAll("[data-entrada]"),
          { opacity: 0, y: 26 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.12,
            scrollTrigger: { trigger: el, start: "top 70%", once: true },
          }
        );
      }, el);
    })();

    return () => {
      cancelado = true;
      ctx?.revert();
    };
  }, [reduzido]);

  return (
    <section id="percurso" className="section shell">
      <h2 className="display-xl mb-14 text-bone">{t(experienceSection.title)}</h2>

      <div ref={raiz} className="relative">
        {/* A linha mora numa coluna própria de 1px, alinhada com os marcadores.
            Em mobile ela sai: com a coluna de datas empilhada não há trilho
            para acompanhar, e a linha viraria um risco solto na margem. */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute left-[calc(200px+24px)] top-0 hidden h-full w-px overflow-visible md:block"
          preserveAspectRatio="none"
        >
          <line
            x1="0.5"
            y1="0"
            x2="0.5"
            y2="100%"
            stroke="var(--color-hairline)"
            strokeWidth="1"
          />
          <line
            ref={traco}
            x1="0.5"
            y1="0"
            x2="0.5"
            y2="100%"
            stroke="var(--color-iris)"
            strokeWidth="1"
          />
        </svg>

        <ol className="m-0 list-none p-0">
          {experience.map((papel) => (
            <li
              key={papel.id}
              data-entrada
              className="relative grid gap-3 pb-14 last:pb-0 md:grid-cols-[200px_minmax(0,1fr)] md:gap-12"
            >
              {/* ---------- coluna de datas ----------
                  Largura fixa de 200px e 48px de distância do conteúdo. Solta,
                  ela abria um abismo de meia tela entre a data e o cargo. */}
              <div className="md:text-right">
                <p className="label tnum m-0 text-bone">{papel.period}</p>
                <p className="mt-1.5 text-sm leading-snug text-muted">{t(papel.org)}</p>
                {papel.current ? (
                  <p className="mt-2 inline-flex items-center gap-1.5 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ok md:flex-row-reverse">
                    <span className="size-1.5 rounded-full bg-ok" aria-hidden="true" />
                    {t(experienceSection.now)}
                  </p>
                ) : null}
              </div>

              {/* marcador na linha */}
              <span
                aria-hidden="true"
                className="absolute left-[calc(200px+24px)] top-1.5 hidden size-2 -translate-x-1/2 rounded-full bg-iris ring-4 ring-void md:block"
              />

              <div>
                <h3 className="display-lg m-0 mb-3 text-[1.5rem] text-bone md:text-[1.75rem]">
                  {t(papel.title)}
                </h3>

                {/*
                 * Duas colunas só quando há texto para duas. Com um item só,
                 * a segunda coluna ficaria vazia ao lado de um parágrafo.
                 *
                 * Nada de `flex` aqui: `display:flex` anula `columns` por
                 * completo, e a lista voltava a ser uma coluna larga só. O
                 * espaçamento entre itens vem de `mb`, não de `gap`.
                 */}
                <ul
                  className={`m-0 list-none p-0 ${
                    papel.points.length > 1
                      ? "max-w-[78ch] lg:columns-2 lg:gap-10"
                      : "max-w-[65ch]"
                  }`}
                >
                  {papel.points.map((ponto, i) => (
                    <li
                      key={i}
                      className="mb-3 break-inside-avoid text-[0.9375rem] leading-relaxed text-muted last:mb-0"
                    >
                      {t(ponto)}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
