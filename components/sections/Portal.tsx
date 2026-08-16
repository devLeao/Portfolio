"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useSound } from "@/components/providers/SoundProvider";
import BongoCat from "@/components/pixel/BongoCat";
import NightSky from "@/components/pixel/NightSky";
import { portal } from "@/content/content";
import { usePrefersReducedMotion } from "@/components/providers/MotionProvider";

/**
 * A travessia entre os dois mundos.
 *
 * Não é `View Transitions API`: aquilo dispara e acontece, sem controle de
 * tempo. Aqui a transição É a rolagem — `scrub` amarra cada etapa à posição
 * exata do scroll, então dá para parar no meio do portal e ficar lá.
 *
 * O palco é `sticky`, não `pin` do ScrollTrigger. O pin insere um espaçador no
 * DOM e, com o Lenis interpolando a rolagem, esse espaçador briga com o
 * cálculo de altura e a seção pula na primeira passagem. `sticky` é do
 * navegador e não tem esse problema.
 *
 * ---------- o que este componente NÃO faz ----------
 * Ele não desenha o céu. O céu é do `PixelWorld`, uma peça só atrás dos três
 * blocos. Quando cada portal pintava o próprio gradiente, as bordas entre
 * portal e playground apareciam como faixas de cor no meio da rolagem.
 *
 * O que o portal desenha é o ESCURO: uma cortina de `--color-void` que some
 * (entrada) ou desce (saída). O mundo pixel está sempre ali atrás; o portal
 * só decide o quanto dele já dá para ver.
 */
export default function Portal({
  sentido = "entrada",
}: {
  sentido?: "entrada" | "saida";
}) {
  const { t } = useLocale();
  const { tocar } = useSound();
  const raiz = useRef<HTMLDivElement>(null);
  const reduzido = usePrefersReducedMotion();
  const entrando = sentido === "entrada";

  useEffect(() => {
    const el = raiz.current;
    if (!el) return;

    // Com movimento reduzido o portal vira um corte seco: o mundo pixel já
    // está lá quando a pessoa chega, sem rolagem coreografada.
    if (reduzido) {
      el.querySelectorAll<HTMLElement>("[data-cortina]").forEach((n) => {
        n.style.opacity = "0";
        n.style.transform = "scaleY(0)";
      });
      el.querySelectorAll<HTMLElement>("[data-dark]").forEach((n) => {
        n.style.opacity = "0";
      });
      el.querySelectorAll<HTMLElement>("[data-pixel]").forEach((n) => {
        n.style.opacity = "1";
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
        const linha = gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.5,
            invalidateOnRefresh: true,
            onEnter: () => tocar("twinkle"),
            onEnterBack: () => tocar("twinkle"),
          },
        });

        if (entrando) {
          linha
            // 1. a tipografia display do mundo dark sai por cima
            .to("[data-dark]", { opacity: 0, y: -80, duration: 0.3 }, 0)
            // 2. o quase-preto se abre e revela o céu noturno que está atrás
            .to("[data-cortina]", { opacity: 0, duration: 0.4 }, 0.05)
            // 3. o gato atravessa puxando a cortina
            .fromTo(
              "[data-gato]",
              { xPercent: -200, opacity: 0 },
              { xPercent: 30, opacity: 1, duration: 0.34, ease: "none" },
              0.28
            )
            .to("[data-gato]", { opacity: 0, duration: 0.1 }, 0.64)
            // 4. e só então a tipografia pixel aparece
            .fromTo(
              "[data-pixel]",
              { opacity: 0, y: 40 },
              { opacity: 1, y: 0, duration: 0.3 },
              0.58
            );
        } else {
          // O escuro desce por cima do roxo, como uma cortina fechando.
          linha
            .to("[data-pixel]", { opacity: 0, y: -40, duration: 0.28 }, 0)
            .fromTo(
              "[data-cortina]",
              { scaleY: 0 },
              { scaleY: 1, duration: 0.5, ease: "none" },
              0.05
            )
            .fromTo(
              "[data-dark]",
              { opacity: 0, y: 40 },
              { opacity: 1, y: 0, duration: 0.3 },
              0.55
            );
        }
      }, el);
    })();

    return () => {
      cancelado = true;
      ctx?.revert();
    };
  }, [reduzido, entrando, tocar]);

  return (
    /* A ida tem cinco etapas coreografadas e precisa de uma viewport inteira
       de rolagem para respirar. A volta tem três e, com a mesma altura,
       sobrava quase uma tela de preto parado antes do contato. */
    <div
      ref={raiz}
      className={`relative ${entrando ? "h-[200svh]" : "h-[150svh]"}`}
      aria-hidden="true"
    >
      <div className="sticky top-0 flex h-svh items-center justify-center overflow-hidden">
        {/* O céu deste trecho, ATRÁS da cortina: é ele que vai sendo
            revelado conforme o escuro se abre. */}
        <NightSky className="absolute inset-0" />

        {/*
         * A cortina escura. Na entrada ela começa opaca e some; na saída
         * começa recolhida no topo e desce. O estado inicial vai no `style`
         * inline porque o GSAP só assume depois do primeiro scroll — sem
         * isso, a saída pisca preta antes de recolher.
         */}
        <div
          data-cortina
          className="absolute inset-0 origin-top bg-void"
          style={entrando ? { opacity: 1 } : { transform: "scaleY(0)" }}
        />

        {/* frase do mundo dark */}
        <p
          data-dark
          className="display-lg absolute px-6 text-center text-bone"
          style={{ opacity: entrando ? 1 : 0 }}
        >
          {t(entrando ? portal.enter : portal.exit)}
        </p>

        {/* A mesma frase, já em pixel. É a troca de tipografia que anuncia o
            outro mundo antes de qualquer conteúdo aparecer. */}
        <p
          data-pixel
          className="pixel-title absolute max-w-[90vw] px-6 text-center text-[clamp(0.6875rem,1.9vw,1.375rem)] leading-loose text-neon"
          style={{
            opacity: entrando ? 0 : 1,
            textShadow: "0 0 18px var(--neon-glow)",
          }}
        >
          {t(entrando ? portal.enter : portal.exit)}
        </p>

        {entrando ? (
          <div data-gato className="absolute bottom-[16%] left-0 w-24 opacity-0 md:w-36">
            <BongoCat />
          </div>
        ) : null}
      </div>
    </div>
  );
}
