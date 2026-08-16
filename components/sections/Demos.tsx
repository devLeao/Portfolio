"use client";

import { useLocale } from "@/components/providers/LocaleProvider";
import SplitReveal from "@/components/ui/SplitReveal";
import SqlDemo from "@/components/demos/SqlDemo";
import AutomacaoDemo from "@/components/demos/AutomacaoDemo";
import LlmDemo from "@/components/demos/LlmDemo";
import { demos } from "@/content/content";

/**
 * "O que eu faço", demonstrado.
 *
 * A seção Sobre já diz em palavras. Esta faz — e é uma diferença que importa
 * num portfólio: qualquer pessoa escreve "trabalho com análise de dados", e
 * quase ninguém deixa a consulta rodando na página para o visitante mexer.
 *
 * Três blocos, um por competência, cada um com o número, o título e uma linha
 * dizendo o que observar. A linha existe porque demo sem instrução vira
 * enfeite: a pessoa não sabe que o nó de decisão ramifica se ninguém contar.
 */

const BLOCOS = [
  { id: "analise", meta: demos.sql, Demo: SqlDemo },
  { id: "automacao", meta: demos.automacao, Demo: AutomacaoDemo },
  { id: "ia", meta: demos.llm, Demo: LlmDemo },
];

export default function Demos() {
  const { t } = useLocale();

  return (
    <section id="pratica" className="section shell">
      <header className="mb-16 max-w-[52ch]">
        <h2 className="display-xl m-0 text-bone">{t(demos.titulo)}</h2>
        <SplitReveal
          as="p"
          text={t(demos.lede)}
          mode="word"
          stagger={0.014}
          className="body-lg mt-6 block text-muted"
        />
      </header>

      <div className="flex flex-col gap-20 lg:gap-28">
        {BLOCOS.map(({ id, meta, Demo }) => (
          <article key={id}>
            <div className="mb-8 flex flex-col gap-3 border-t border-hairline pt-6 md:flex-row md:items-baseline md:gap-8">
              <p className="label tnum m-0 shrink-0 md:w-16">{meta.numero}</p>
              <div>
                <h3 className="display-lg m-0 text-[1.5rem] text-bone md:text-[2rem]">
                  {t(meta.titulo)}
                </h3>
                <p className="mt-3 max-w-[60ch] text-[0.9375rem] leading-relaxed text-muted">
                  {t(meta.lede)}
                </p>
              </div>
            </div>

            <Demo />

            {/* A ressalva do bloco de IA fica embaixo dele, não escondida no
                README: dizer que não há chamada de API é o que mantém a demo
                honesta. */}
            {id === "ia" ? (
              <p className="mt-5 max-w-[70ch] text-xs leading-relaxed text-muted">
                {t(demos.llm.nota)}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
