"use client";

import { useState } from "react";
import Image from "next/image";
import { useLocale } from "@/components/providers/LocaleProvider";
import { formacao } from "@/content/content";

/**
 * Formação: o acadêmico e os certificados.
 *
 * Fica depois do mundo pixel e antes do contato — quem chegou até aqui já viu
 * o que eu construo; esta seção responde "e onde ele aprendeu isso".
 *
 * Os certificados são MOSTRADOS, não listados. Lista de nome de curso não
 * prova nada e ninguém lê; a imagem do papel com nome, carga horária e código
 * de verificação prova. Clicar abre em tamanho cheio.
 */
export default function Formacao() {
  const { t } = useLocale();
  const [aberto, setAberto] = useState<number | null>(null);

  const certificado = aberto !== null ? formacao.certificados[aberto] : null;

  return (
    <section id="formacao" className="section shell">
      <header className="mb-14 max-w-[52ch]">
        <h2 className="display-xl m-0 text-bone">{t(formacao.titulo)}</h2>
        <p className="body-lg mt-6 text-muted">{t(formacao.lede)}</p>
      </header>

      {/* ---------- acadêmico ----------
          Duas linhas só, com o curso em andamento marcado como tal. Pós em
          andamento anunciada como concluída é o tipo de detalhe que derruba
          a confiança inteira numa checagem de dois minutos. */}
      {/*
       * Cards da mesma altura, com o rodapé ancorado embaixo.
       *
       * Altura igual sozinha não bastava: o card de DevOps tem título de uma
       * linha contra as três do ADS, então sobrava um palmo de vazio no fim
       * dele. `flex flex-col` no card e `mt-auto` no bloco de instituição
       * empurram o rodapé dos dois para a mesma linha de base — o espaço
       * extra fica ENTRE o título e o rodapé, onde lê como respiro, em vez de
       * ficar pendurado no fim, onde lê como conteúdo que faltou.
       */}
      <ul className="m-0 grid list-none gap-4 p-0 md:grid-cols-2">
        {formacao.academico.map((item) => (
          <li
            key={item.id}
            className="flex flex-col rounded-lg border border-hairline bg-surface/50 p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <p className="label m-0">{t(item.nivel)}</p>
              {item.emCurso ? (
                <span className="flex shrink-0 items-center gap-1.5 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ok">
                  <span
                    aria-hidden="true"
                    className="motion-ambient size-1.5 animate-pulse rounded-full bg-ok"
                  />
                  {t(formacao.emCurso)}
                </span>
              ) : (
                <span className="shrink-0 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-muted">
                  {t(formacao.concluido)}
                </span>
              )}
            </div>

            <h3 className="display-lg m-0 mt-3 text-[1.375rem] text-bone md:text-[1.625rem]">
              {t(item.curso)}
            </h3>

            <div className="mt-auto pt-4">
              <p className="m-0 text-sm text-muted">
                {item.instituicao} · {t(item.periodo)}
              </p>

              {item.arquivo ? (
                <a
                  href={item.arquivo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-iris-soft no-underline transition-colors hover:text-bone"
                >
                  {t(formacao.verDiploma)}
                  <span aria-hidden="true">↗</span>
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      {/* ---------- certificados ---------- */}
      <h3 className="label mt-16">{t(formacao.tituloCertificados)}</h3>

      <ul className="m-0 mt-6 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {formacao.certificados.map((cert, i) => (
          <li key={cert.id}>
            <button
              type="button"
              onClick={() => setAberto(i)}
              /* `flex h-full flex-col` + `mt-auto` no rodapé: as descrições
                 têm tamanhos diferentes, e sem isso a linha de carga horária
                 flutuava numa altura diferente em cada card da mesma fileira. */
              className="group flex h-full w-full flex-col overflow-hidden rounded-lg border border-hairline bg-surface/40 text-left transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-iris"
            >
              {/* A miniatura mostra o topo do certificado, que é onde ficam a
                  instituição e o título — o resto é assinatura e rodapé. */}
              <span className="relative block aspect-[16/9] overflow-hidden border-b border-hairline bg-void">
                <Image
                  src={cert.imagem}
                  alt={t(cert.curso)}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
              </span>

              <span className="flex flex-1 flex-col p-5">
                <span className="label block">{cert.instituicao}</span>
                <span className="mt-2 block text-[0.9375rem] leading-snug text-bone">
                  {t(cert.curso)}
                </span>

                {/* A descrição é o que transforma a lista em informação: nome
                    de curso sozinho não diz o que a pessoa sabe fazer. */}
                <span className="mt-3 block text-[0.8125rem] leading-relaxed text-muted">
                  {t(cert.descricao)}
                </span>

                <span className="mt-auto flex items-center justify-between gap-3 border-t border-hairline pt-3">
                  <span className="font-mono text-xs text-muted">{t(cert.carga)}</span>
                  <span className="font-mono text-xs tabular-nums text-muted">{t(cert.data)}</span>
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {/* ---------- visualizador ----------
          Diálogo simples: fundo escurecido, imagem inteira, Esc e clique fora
          fecham. Sem biblioteca de lightbox para trazer 30KB por causa de
          cinco imagens. */}
      {certificado ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t(certificado.curso)}
          onClick={() => setAberto(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setAberto(null);
          }}
          tabIndex={-1}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-void/92 p-4 backdrop-blur-sm md:p-10"
        >
          <div className="relative max-h-full w-full max-w-4xl">
            <Image
              src={certificado.imagem}
              alt={t(certificado.curso)}
              width={1600}
              height={900}
              className="h-auto max-h-[80svh] w-full rounded-lg border border-hairline object-contain"
            />
            <p className="mt-4 text-center text-sm text-muted">
              {certificado.instituicao} · {t(certificado.curso)} · {t(certificado.data)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setAberto(null)}
            aria-label={t(formacao.fechar)}
            className="fixed right-5 top-5 rounded-full border border-hairline bg-surface px-4 py-2 font-mono text-xs uppercase tracking-[0.12em] text-bone transition-colors hover:border-iris"
          >
            {t(formacao.fechar)}
          </button>
        </div>
      ) : null}
    </section>
  );
}
