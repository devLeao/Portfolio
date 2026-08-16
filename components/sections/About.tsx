"use client";

import { useLocale } from "@/components/providers/LocaleProvider";
import { about } from "@/content/content";
import SplitReveal from "@/components/ui/SplitReveal";

/**
 * Dois parágrafos e três cards. O texto entra palavra a palavra no scroll;
 * os cards entram depois, para o olho ler na ordem certa.
 */
export default function About() {
  const { t } = useLocale();

  return (
    <section id="sobre" className="section shell">
      <p className="label mb-8">{t(about.label)}</p>

      {/* O texto para em ~62ch mesmo com espaço de sobra: linha longa demais
          é cansativa, e a coluna vazia à direita aqui é intencional — ela
          segura o respiro antes dos cards. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,62ch)_minmax(0,1fr)] lg:gap-16">
        <div className="flex flex-col gap-5">
          {about.paragraphs.map((paragrafo, i) => (
            <SplitReveal
              key={i}
              as="p"
              text={t(paragrafo)}
              mode="word"
              stagger={0.014}
              className="body-lg block text-bone"
            />
          ))}
        </div>

        <div className="hidden lg:block" aria-hidden="true" />
      </div>

      <ul className="mt-16 grid gap-4 md:grid-cols-3">
        {about.crafts.map((craft) => (
          <li
            key={craft.id}
            className="group rounded-lg border border-hairline bg-surface/50 p-6 transition-[transform,border-color,background-color] duration-300 hover:-translate-y-1.5 hover:border-iris hover:bg-[var(--iris-veil)]"
          >
            <h3 className="display-lg mb-3 text-[1.375rem] text-bone md:text-[1.5rem]">
              {t(craft.title)}
            </h3>
            <p className="text-[0.9375rem] leading-relaxed text-muted transition-colors group-hover:text-bone">
              {t(craft.body)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
