"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useSound } from "@/components/providers/SoundProvider";
import { qualificar, type Analise } from "@/lib/qualificador";
import { demos } from "@/content/content";

/**
 * O assistente de triagem: chat de verdade, com o processamento à vista.
 *
 * Você escreve o que quiser e ele responde a PARTIR do texto — a extração
 * roda por regra no navegador (`lib/qualificador.ts`), sem chamada de API.
 *
 * ---------- o que o painel do meio mostra ----------
 * As quatro etapas que um assistente de produção realmente executa antes de
 * abrir a boca: ler, extrair entidades, checar escopo, medir confiança. Elas
 * aparecem uma a uma porque é assim que a coisa acontece — e porque um
 * "pensando…." genérico esconde exatamente a parte que interessa a quem está
 * avaliando se eu sei fazer isso.
 *
 * A resposta sai em streaming, caractere a caractere. Não é enfeite: é a
 * forma como um modelo entrega, e o site inteiro tenta mostrar o processo, e
 * não só o resultado.
 */

type Mensagem =
  | { de: "pessoa"; texto: string }
  | { de: "bot"; texto: string; completo: boolean; analise: Analise };

/** Rostinho do assistente. Dois olhos e uma antena — muda com o estado. */
function Robo({ estado }: { estado: "parado" | "pensando" | "falando" | "recusou" }) {
  return (
    <div
      className={`relative flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
        estado === "recusou"
          ? "border-bad/60 bg-bad/10"
          : estado === "pensando"
            ? "border-iris bg-[var(--iris-veil)]"
            : "border-hairline bg-surface"
      }`}
      aria-hidden="true"
    >
      {/* antena */}
      <span
        className={`absolute -top-1.5 size-1.5 rounded-full ${
          estado === "pensando"
            ? "motion-ambient animate-ping bg-iris"
            : estado === "recusou"
              ? "bg-bad"
              : "bg-ok"
        }`}
      />
      <span className="absolute -top-0.5 h-1.5 w-px bg-hairline" />

      {/* olhos: piscam quando fala, viram traço quando recusa */}
      <span className="flex gap-1.5">
        {[0, 1].map((i) => (
          <span
            key={i}
            className={`block bg-bone transition-all ${
              estado === "recusou"
                ? "h-0.5 w-2 rounded-full"
                : estado === "falando"
                  ? "size-1.5 rounded-full"
                  : "h-2 w-1.5 rounded-sm"
            }`}
          />
        ))}
      </span>
    </div>
  );
}

export default function LlmDemo() {
  const { t } = useLocale();
  const { tocar } = useSound();

  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [entrada, setEntrada] = useState("");
  const [etapa, setEtapa] = useState(-1);
  const [processando, setProcessando] = useState(false);
  const fim = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  const limpar = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  useEffect(() => limpar, [limpar]);

  useEffect(() => {
    fim.current?.scrollIntoView({ block: "nearest" });
  }, [mensagens, etapa]);

  const enviar = useCallback(
    (texto: string) => {
      const limpo = texto.trim();
      if (!limpo || processando) return;

      limpar();
      setMensagens((antes) => [...antes, { de: "pessoa", texto: limpo }]);
      setEntrada("");
      setProcessando(true);
      setEtapa(0);

      const analise = qualificar(limpo);

      // As quatro etapas, uma a cada 260ms. Rápido o bastante para não
      // irritar, lento o bastante para dar para ler.
      [1, 2, 3].forEach((n) => {
        const id = window.setTimeout(() => {
          setEtapa(n);
          tocar("virar");
        }, n * 260);
        timers.current.push(id);
      });

      const iniciar = window.setTimeout(() => {
        setEtapa(-1);
        setProcessando(false);
        tocar(analise.precisaHumano ? "erro" : "acerto");

        setMensagens((antes) => [
          ...antes,
          { de: "bot", texto: "", completo: false, analise },
        ]);

        // ---------- streaming ----------
        // Blocos de 2 caracteres: um a um fica lento demais para 200 chars.
        let i = 0;
        const escrever = () => {
          i += 2;
          const parcial = analise.resposta.slice(0, i);
          setMensagens((antes) => {
            const copia = [...antes];
            const ultimo = copia[copia.length - 1];
            if (ultimo?.de === "bot") {
              copia[copia.length - 1] = {
                ...ultimo,
                texto: parcial,
                completo: i >= analise.resposta.length,
              };
            }
            return copia;
          });

          if (i < analise.resposta.length) {
            const id = window.setTimeout(escrever, 14);
            timers.current.push(id);
          }
        };
        escrever();
      }, 1120);

      timers.current.push(iniciar);
    },
    [processando, limpar, tocar]
  );

  const ultima = [...mensagens].reverse().find((m) => m.de === "bot");
  const analise = ultima?.de === "bot" ? ultima.analise : null;
  const escrevendo = ultima?.de === "bot" && !ultima.completo;

  const estadoRobo = processando
    ? "pensando"
    : escrevendo
      ? "falando"
      : analise?.precisaHumano
        ? "recusou"
        : "parado";

  const ETAPAS = [
    demos.llm.etapas.ler,
    demos.llm.etapas.extrair,
    demos.llm.etapas.escopo,
    demos.llm.etapas.confianca,
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-6">
      {/* ---------- conversa ---------- */}
      <div className="flex flex-col overflow-hidden rounded-xl border border-hairline bg-surface/40">
        <div className="flex items-center gap-3 border-b border-hairline px-4 py-3">
          <Robo estado={estadoRobo} />
          <div className="min-w-0">
            <p className="m-0 truncate text-sm font-medium text-bone">
              {t(demos.llm.tituloChat)}
            </p>
            <p className="label m-0 mt-0.5">
              {processando
                ? t(demos.llm.pensando)
                : escrevendo
                  ? t(demos.llm.escrevendo)
                  : t(demos.llm.online)}
            </p>
          </div>
        </div>

        <div className="scroll-slim flex max-h-[320px] min-h-[280px] flex-1 flex-col gap-3 overflow-y-auto p-4">
          {mensagens.length === 0 ? (
            <p className="m-0 text-sm leading-relaxed text-muted">{t(demos.llm.vazio)}</p>
          ) : null}

          {mensagens.map((m, i) => (
            <div
              key={i}
              className={`flex items-end gap-2 ${m.de === "pessoa" ? "self-end" : "self-start"}`}
            >
              {m.de === "bot" ? <Robo estado={estadoRobo} /> : null}
              <div
                className={`max-w-[min(30rem,80%)] rounded-xl px-3.5 py-2.5 text-[0.9375rem] leading-relaxed ${
                  m.de === "pessoa"
                    ? "rounded-br-sm bg-iris/25 text-bone"
                    : "rounded-bl-sm border border-hairline bg-void/60 text-bone"
                }`}
              >
                {m.de === "bot" ? (
                  <>
                    {m.texto}
                    {/* cursor de digitação */}
                    {!m.completo ? (
                      <span className="motion-ambient ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-iris align-text-bottom" />
                    ) : null}
                  </>
                ) : (
                  m.texto
                )}
              </div>
            </div>
          ))}

          {/* ---------- etapas do processamento ---------- */}
          {processando ? (
            <div className="flex items-start gap-2 self-start">
              <Robo estado="pensando" />
              <ul className="m-0 flex list-none flex-col gap-1.5 rounded-xl rounded-bl-sm border border-hairline bg-void/60 px-3.5 py-3 p-0">
                {ETAPAS.map((e, i) => (
                  <li
                    key={i}
                    className={`flex items-center gap-2 font-mono text-[0.75rem] transition-colors ${
                      i < etapa ? "text-ok" : i === etapa ? "text-bone" : "text-muted/50"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`size-1.5 shrink-0 rounded-full ${
                        i < etapa
                          ? "bg-ok"
                          : i === etapa
                            ? "motion-ambient animate-ping bg-iris"
                            : "bg-hairline"
                      }`}
                    />
                    {t(e)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div ref={fim} />
        </div>

        <div className="flex flex-wrap gap-1.5 border-t border-hairline px-4 pt-3">
          {demos.llm.sugestoes.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => enviar(t(s))}
              disabled={processando}
              className="rounded-full border border-hairline px-2.5 py-1 text-[0.6875rem] text-muted transition-colors hover:border-iris hover:text-bone disabled:opacity-40"
            >
              {t(s)}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            enviar(entrada);
          }}
          className="flex gap-2 p-4"
        >
          <input
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            placeholder={t(demos.llm.placeholder)}
            aria-label={t(demos.llm.placeholder)}
            className="min-w-0 flex-1 rounded-full border border-hairline bg-void/60 px-4 py-2.5 text-sm text-bone outline-none transition-colors placeholder:text-muted focus:border-iris"
          />
          <button
            type="submit"
            disabled={processando || !entrada.trim()}
            className="shrink-0 rounded-full bg-iris px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-void transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {t(demos.llm.enviar)}
          </button>
        </form>
      </div>

      {/* ---------- saída estruturada ---------- */}
      <div className="flex flex-col gap-3">
        <div className="scroll-slim min-h-[240px] overflow-auto rounded-xl border border-hairline bg-void/70 p-4">
          <p className="label m-0 mb-3">{t(demos.llm.saidaTitulo)}</p>

          {!analise ? (
            <p className="m-0 font-mono text-[0.8125rem] text-muted">
              {t(demos.llm.saidaVazia)}
            </p>
          ) : (
            <pre className="m-0 whitespace-pre-wrap font-mono text-[0.8125rem] leading-relaxed text-bone">
              <code>
                {JSON.stringify(
                  {
                    intencao: analise.intencao,
                    urgencia: analise.urgencia,
                    orcamento: analise.orcamento,
                    prazo: analise.prazo,
                    confianca: analise.confianca,
                    precisa_humano: analise.precisaHumano,
                    proximo_passo: analise.proximoPasso,
                  },
                  null,
                  2
                )}
              </code>
            </pre>
          )}
        </div>

        {analise ? (
          <div className="rounded-xl border border-hairline bg-surface/40 p-4">
            <div className="flex items-baseline justify-between">
              <p className="label m-0">{t(demos.llm.confianca)}</p>
              <p className="m-0 font-mono text-sm tabular-nums text-bone">
                {Math.round(analise.confianca * 100)}%
              </p>
            </div>
            <div className="relative mt-2 h-2 w-full overflow-hidden rounded-full bg-hairline">
              <div
                className={`h-full rounded-full transition-[width] duration-500 ${
                  analise.precisaHumano ? "bg-bad" : "bg-ok"
                }`}
                style={{ width: `${analise.confianca * 100}%` }}
              />
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-[55%] w-px bg-bone/50"
              />
            </div>

            <p
              className={`m-0 mt-3 text-[0.8125rem] leading-snug ${
                analise.precisaHumano ? "text-bad" : "text-muted"
              }`}
            >
              {analise.precisaHumano ? t(demos.llm.avisoHumano) : t(demos.llm.avisoOk)}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
