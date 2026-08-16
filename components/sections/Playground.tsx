"use client";

import { useLocale } from "@/components/providers/LocaleProvider";
import BongoCat from "@/components/pixel/BongoCat";
import NightSky from "@/components/pixel/NightSky";
import PixelSprite from "@/components/pixel/PixelSprite";
import { ESTRELA, PALETA_ESTRELA } from "@/components/pixel/sprites";
import { playground } from "@/content/content";

/** Cada card tem sua cor — as três da referência cozy. */
const ACENTO = {
  neon: {
    texto: "text-neon",
    borda: "hover:shadow-[0_0_0_2px_var(--color-neon),0_0_0_6px_var(--color-px-card),0_0_0_8px_var(--color-neon),0_0_28px_var(--neon-glow)]",
  },
  blue: {
    texto: "text-cozy-blue",
    borda: "hover:shadow-[0_0_0_2px_var(--color-cozy-blue),0_0_0_6px_var(--color-px-card),0_0_0_8px_var(--color-cozy-blue),0_0_28px_rgb(96_165_250/0.4)]",
  },
  pink: {
    texto: "text-px-pink",
    borda: "hover:shadow-[0_0_0_2px_var(--color-px-pink),0_0_0_6px_var(--color-px-card),0_0_0_8px_var(--color-px-pink),0_0_28px_rgb(244_114_182/0.4)]",
  },
} as const;

/**
 * O mundo pixel.
 *
 * O céu é o MESMO gradiente com que o portal termina — sem isso a costura
 * apareceria como uma faixa de cor no meio da rolagem.
 */
export default function Playground() {
  const { t } = useLocale();

  return (
    <section
      id="playground"
      // Sem fundo próprio: o céu é do PixelWorld, uma peça só para os três
      // blocos. Pintar aqui de novo criaria emenda na borda da seção.
      className="relative overflow-hidden py-24 pb-52 lg:py-32 lg:pb-64"
      style={{ scrollMarginTop: "var(--header-h)" }}
    >
      {/* Estrelas na seção inteira: pontinho de 8px não briga com texto. */}
      <NightSky nuvens={false} className="absolute inset-0" />

      {/* Nuvens só na faixa de baixo, onde vive o gato e não há o que ler. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 md:h-52">
        <NightSky estrelas={false} className="absolute inset-0" />
      </div>

      <div className="shell relative">
        <header className="text-center">
          <h2
            className="pixel-title m-0 text-[clamp(1.125rem,4vw,2.75rem)] text-neon"
            style={{ textShadow: "0 0 22px var(--neon-glow)" }}
          >
            {t(playground.title)}
          </h2>
          <p className="pixel-body mx-auto mt-6 max-w-[46ch] text-cloud-rose">
            {t(playground.subtitle)}
          </p>
        </header>

        {/* Padding no fim reserva a faixa onde o gato senta. Sem ele, o
            mascote cobre o canto do terceiro card. */}
        <ul className="mt-16 grid list-none grid-cols-1 gap-8 p-0 pb-28 md:grid-cols-2 md:pb-32 xl:grid-cols-4">
          {playground.quests.map((quest) => {
            const acento = ACENTO[quest.accent];
            const Conteudo = (
              <>
                <PixelSprite
                  bitmap={ESTRELA}
                  paleta={PALETA_ESTRELA}
                  className="mb-4 w-5"
                />
                <h3 className={`pixel-title m-0 text-[0.8125rem] leading-relaxed ${acento.texto}`}>
                  {t(quest.title)}
                </h3>
                <p className="pixel-body mt-4 text-cloud-rose/90">{t(quest.body)}</p>

                {/* Cada card leva ao jogo lá embaixo. O selo é convite, não
                    rótulo: quem lê a história quer jogar em seguida. */}
                <span className="mt-5 inline-flex items-center gap-1.5 border border-cloud-gold px-2 py-1 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-cloud-gold">
                  {t(playground.todoBadge)}
                  <span aria-hidden="true">↓</span>
                </span>
              </>
            );

            return (
              <li key={quest.id}>
                {quest.href ? (
                  <a
                    href={quest.href}
                    /* Âncora interna não abre em aba nova. Os cards levam ao
                       arcade na mesma página; `_blank` aqui abriria uma cópia
                       do site inteiro só para rolar até embaixo. */
                    {...(quest.href.startsWith("#")
                      ? {}
                      : { target: "_blank", rel: "noopener noreferrer" })}
                    className={`pixel-frame block h-full bg-px-card/70 p-7 no-underline transition-transform duration-200 hover:-translate-y-1 ${acento.borda}`}
                  >
                    {Conteudo}
                  </a>
                ) : (
                  <div
                    className={`pixel-frame h-full bg-px-card/70 p-7 transition-transform duration-200 hover:-translate-y-1 ${acento.borda}`}
                  >
                    {Conteudo}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* O mascote, aqui na aparição grande — é a seção dele. */}
      <div className="pointer-events-none absolute bottom-6 right-4 w-24 md:right-10 md:w-36">
        <BongoCat title={t(playground.catAlt)} />
      </div>
    </section>
  );
}
