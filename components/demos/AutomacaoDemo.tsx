"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useSound } from "@/components/providers/SoundProvider";
import {
  ALTURA_FILHO,
  ALTURA_NO,
  CORES,
  ICONES,
  LARGURA_FILHO,
  LARGURA_NO,
  LIGACOES,
  NOS,
  curva,
  entradaDe,
  saidaDe,
} from "@/lib/fluxoN8n";
import { demos } from "@/content/content";

/**
 * O editor de fluxo, como no n8n.
 *
 * A versão anterior era uma lista vertical de caixas — parecia um checklist,
 * não um fluxo. O que faz o n8n LER como automação são três coisas, e as três
 * estão aqui:
 *
 * 1. Os nós ocupam POSIÇÕES num plano, não linhas de uma lista. O caminho
 *    serpenteia e volta, como um circuito.
 * 2. Os fios são bezier saindo na horizontal, com o galho `true` seguindo em
 *    frente e o `false` descendo. Ver a bifurcação é entender a regra.
 * 3. O dado VIAJA. Um pacote luminoso percorre cada fio, e é ele que conta
 *    onde a execução está — não um texto dizendo "passo 3 de 8".
 *
 * O pacote anda pelo caminho de verdade: `getPointAtLength` no `<path>` que
 * já está desenhado. Recalcular a curva em JS daria uma trajetória parecida,
 * mas não a MESMA, e a diferença apareceria como o pacote saindo do fio.
 */

type EstadoNo = "espera" | "rodando" | "ok" | "pulado" | "barrado";

/** Velocidade do pacote, em px do viewBox por segundo. Ver `percorrer`. */
const VELOCIDADE_PACOTE = 260;

type Registro = { texto: string; tom: "normal" | "decisao" | "alerta" };

type Cliente = {
  nome: string;
  valor: number;
  atraso: number;
  aberto: boolean;
  acordo: boolean;
};

const CLIENTES: Cliente[] = [
  { nome: "Beta Foods", valor: 92_150, atraso: 47, aberto: true, acordo: false },
  { nome: "Grão Norte", valor: 38_200, atraso: 0, aberto: false, acordo: false },
  { nome: "Hexa Móveis", valor: 174_500, atraso: 128, aberto: true, acordo: true },
];

/** Um passo da execução: acende um nó e, antes dele, percorre um fio. */
type Passo = {
  no: string;
  /** Índice da ligação a percorrer antes de acender o nó. */
  fio?: number;
  estado: EstadoNo;
  /**
   * Sub-nós que acendem JUNTO com este.
   *
   * É o caso do AI Agent: modelo, memória e base vetorial não são etapas do
   * fluxo, são capacidades que o agente usa dentro da própria execução. Por
   * isso acendem no mesmo instante que ele, e não em sequência.
   */
  filhos?: string[];
  log?: Registro;
};

export default function AutomacaoDemo() {
  const { t } = useLocale();
  const { tocar } = useSound();

  const [cliente, setCliente] = useState(0);
  const [estados, setEstados] = useState<Record<string, EstadoNo>>({});
  const [fiosAtivos, setFiosAtivos] = useState<Set<number>>(new Set());
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [rodando, setRodando] = useState(false);

  const pathsRef = useRef<(SVGPathElement | null)[]>([]);
  const pacoteRef = useRef<SVGCircleElement>(null);
  const timers = useRef<number[]>([]);
  const raf = useRef(0);

  const porId = useMemo(() => new Map(NOS.map((n) => [n.id, n])), []);

  /** Geometria de cada ligação, calculada uma vez. */
  const fios = useMemo(
    () =>
      LIGACOES.map((l) => {
        const de = porId.get(l.de);
        const para = porId.get(l.para);
        if (!de || !para) return null;
        const a = saidaDe(de, l.saida);
        const b = entradaDe(para, l.entrada);
        return { ...l, d: curva(a, b, l.saida, l.entrada), meio: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
      }).filter(Boolean) as (typeof LIGACOES[number] & { d: string; meio: { x: number; y: number } })[],
    [porId]
  );

  const limpar = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    cancelAnimationFrame(raf.current);
  }, []);

  useEffect(() => limpar, [limpar]);

  /**
   * Move o pacote ao longo de um fio, e resolve quando chega.
   *
   * A duração é DERIVADA do comprimento — o pacote anda sempre a
   * `VELOCIDADE_PACOTE` px/s. Com uma duração fixa para todo fio, ele
   * atravessava um fio curto devagar e um longo numa velocidade absurda, e aí
   * a leitura de "o dado está viajando" se perde: velocidade que muda sozinha
   * não parece movimento, parece defeito.
   */
  const percorrer = useCallback(
    (indice: number) =>
      new Promise<void>((resolve) => {
        const path = pathsRef.current[indice];
        const pacote = pacoteRef.current;
        if (!path || !pacote) {
          resolve();
          return;
        }

        const total = path.getTotalLength();
        /*
         * Piso e teto largos DE PROPÓSITO: eles são rede de segurança, não
         * ajuste. Um piso apertado (240ms) fazia todos os fios curtos baterem
         * nele e virava, na prática, a duração fixa de antes — só que agora o
         * galho longo do IF, único a escapar do piso, andava ao dobro da
         * velocidade dos outros. Deixando a fórmula governar, todo fio anda
         * igual.
         */
        const dur = Math.min(1400, Math.max(120, (total / VELOCIDADE_PACOTE) * 1000));
        const inicio = performance.now();
        pacote.style.opacity = "1";

        const passo = (agora: number) => {
          const k = Math.min(1, (agora - inicio) / dur);
          const p = path.getPointAtLength(total * k);
          pacote.setAttribute("cx", String(p.x));
          pacote.setAttribute("cy", String(p.y));

          if (k < 1) {
            raf.current = requestAnimationFrame(passo);
          } else {
            pacote.style.opacity = "0";
            resolve();
          }
        };

        raf.current = requestAnimationFrame(passo);
      }),
    []
  );

  const rodar = useCallback(async () => {
    limpar();
    const c = CLIENTES[cliente] ?? CLIENTES[0];
    if (!c) return;

    const iFio = (de: string, para: string) =>
      fios.findIndex((f) => f.de === de && f.para === para);

    /*
     * O roteiro é MONTADO a partir do cliente. É isso que faz o IF e o Filter
     * significarem alguma coisa: cliente diferente percorre fios diferentes e
     * deixa nós inteiros sem executar.
     */
    const passos: Passo[] = [
      { no: "cron", estado: "ok", log: { texto: t(demos.automacao.log.cron), tom: "normal" } },
      {
        no: "supabase",
        fio: iFio("cron", "supabase"),
        estado: "ok",
        log: {
          texto: `${t(demos.automacao.log.supabase)} ${c.nome} · R$ ${c.valor.toLocaleString("pt-BR")} · ${c.atraso}d`,
          tom: "normal",
        },
      },
      { no: "if", fio: iFio("supabase", "if"), estado: "ok" },
    ];

    if (!c.aberto) {
      passos.push({
        no: "fim",
        fio: iFio("if", "fim"),
        estado: "ok",
        log: { texto: t(demos.automacao.log.seNao), tom: "decisao" },
      });
    } else {
      passos.push({
        no: "filtro",
        fio: iFio("if", "filtro"),
        estado: c.acordo ? "barrado" : "ok",
        log: c.acordo
          ? { texto: t(demos.automacao.log.barrado), tom: "alerta" }
          : { texto: t(demos.automacao.log.filtro), tom: "normal" },
      });

      if (!c.acordo) {
        // O agente acende junto com os sub-nós: modelo, memória e RAG fazem
        // parte da MESMA execução, não são etapas separadas do fluxo.
        passos.push({
          no: "agente",
          fio: iFio("filtro", "agente"),
          estado: "ok",
          filhos: ["modelo", "memoria", "vetor"],
          log: { texto: t(demos.automacao.log.agente), tom: "normal" },
        });
        passos.push({
          no: "codigo",
          fio: iFio("agente", "codigo"),
          estado: "ok",
          log: { texto: t(demos.automacao.log.codigo), tom: "normal" },
        });
        passos.push({
          no: "whatsapp",
          fio: iFio("codigo", "whatsapp"),
          estado: "ok",
          log: {
            texto: `${t(demos.automacao.log.whatsapp)} “${t(demos.automacao.log.mensagem)}”`,
            tom: "normal",
          },
        });
        passos.push({
          no: "log",
          fio: iFio("whatsapp", "log"),
          estado: "ok",
          log: { texto: t(demos.automacao.log.registrado), tom: "normal" },
        });
      }
    }

    // Tudo que não está no roteiro fica explicitamente PULADO — apagado, não
    // apenas "ainda não chegou". A diferença conta a história do desvio.
    const visitados = new Set(passos.flatMap((p) => [p.no, ...(p.filhos ?? [])]));
    const iniciais: Record<string, EstadoNo> = {};
    for (const n of NOS) iniciais[n.id] = visitados.has(n.id) ? "espera" : "pulado";

    setEstados(iniciais);
    setFiosAtivos(new Set());
    setRegistros([]);
    setRodando(true);

    const dormir = (ms: number) =>
      new Promise<void>((r) => {
        const id = window.setTimeout(r, ms);
        timers.current.push(id);
      });

    for (const p of passos) {
      if (p.fio !== undefined && p.fio >= 0) {
        setFiosAtivos((antes) => new Set(antes).add(p.fio as number));
        await percorrer(p.fio);
      }

      setEstados((antes) => {
        const proximo = { ...antes, [p.no]: "rodando" as EstadoNo };
        for (const f of p.filhos ?? []) proximo[f] = "rodando";
        return proximo;
      });
      await dormir(p.filhos ? 620 : 340);
      setEstados((antes) => {
        const proximo = { ...antes, [p.no]: p.estado };
        for (const f of p.filhos ?? []) proximo[f] = "ok";
        return proximo;
      });

      if (p.no === "if") {
        const decisao = c.aberto
          ? { texto: t(demos.automacao.log.seSim), tom: "decisao" as const }
          : { texto: "", tom: "normal" as const };
        if (decisao.texto) {
          setRegistros((antes) => [...antes, decisao]);
          tocar("acerto");
        }
      }

      if (p.log) {
        setRegistros((antes) => [...antes, p.log as Registro]);
        tocar(p.log.tom === "alerta" ? "erro" : p.log.tom === "decisao" ? "acerto" : "virar");
      }

      await dormir(120);
    }

    if (c.acordo) {
      setRegistros((antes) => [
        ...antes,
        { texto: t(demos.automacao.log.registradoBarrado), tom: "normal" },
      ]);
    }

    setRodando(false);
    tocar("vitoria");
  }, [cliente, fios, limpar, percorrer, t, tocar]);

  return (
    <div className="flex flex-col gap-4">
      {/* ---------- barra do editor ---------- */}
      <div className="flex flex-wrap items-center gap-2 rounded-t-xl border border-hairline bg-surface/60 px-4 py-3">
        <span className="label m-0 mr-2">{t(demos.automacao.tituloCanvas)}</span>
        {CLIENTES.map((c, i) => (
          <button
            key={c.nome}
            type="button"
            disabled={rodando}
            onClick={() => {
              setCliente(i);
              setEstados({});
              setRegistros([]);
              setFiosAtivos(new Set());
            }}
            aria-pressed={i === cliente}
            className={`rounded-md border px-2.5 py-1 font-mono text-[0.6875rem] transition-colors disabled:opacity-40 ${
              i === cliente
                ? "border-iris bg-[var(--iris-veil)] text-bone"
                : "border-hairline text-muted hover:text-bone"
            }`}
          >
            {c.nome}
          </button>
        ))}

        <button
          type="button"
          onClick={rodar}
          disabled={rodando}
          className="ml-auto rounded-md bg-iris px-4 py-1.5 font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-void transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {rodando ? t(demos.automacao.rodando) : t(demos.automacao.rodar)}
        </button>
      </div>

      {/* ---------- canvas ---------- */}
      <div className="scroll-slim -mt-4 overflow-x-auto rounded-b-xl border border-t-0 border-hairline bg-void/70">
        <svg
          viewBox="0 0 1670 296"
          className="block h-auto w-full min-w-[1240px]"
          role="img"
          aria-label={t(demos.automacao.tituloCanvas)}
        >
          <defs>
            {/* Grade pontilhada — a assinatura visual de um editor de fluxo. */}
            <pattern id="grade" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="var(--color-hairline)" />
            </pattern>
            <filter id="brilho" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width="1670" height="296" fill="url(#grade)" />

          {/* ---------- fios ---------- */}
          {fios.map((f, i) => {
            const ativo = fiosAtivos.has(i);
            return (
              <g key={`${f.de}-${f.para}`}>
                <path
                  ref={(el) => {
                    pathsRef.current[i] = el;
                  }}
                  d={f.d}
                  fill="none"
                  strokeWidth={ativo ? 2.5 : 1.6}
                  stroke={ativo ? "var(--color-iris)" : "var(--color-hairline)"}
                  /* Conector de sub-nó é pontilhado, como no n8n: ele não
                     carrega dado do fluxo, carrega capacidade para o agente. */
                  strokeDasharray={f.filho ? "4 5" : undefined}
                  className="transition-[stroke,stroke-width] duration-300"
                />
                {f.rotulo ? (
                  <text
                    x={f.meio.x}
                    y={f.meio.y - 8}
                    textAnchor="middle"
                    className={`font-mono text-[11px] ${
                      f.rotulo === "true" ? "fill-ok" : "fill-muted"
                    }`}
                  >
                    {f.rotulo}
                  </text>
                ) : null}
              </g>
            );
          })}

          {/* pacote que viaja pelo fio */}
          <circle
            ref={pacoteRef}
            r="6"
            fill="var(--color-iris-soft)"
            filter="url(#brilho)"
            style={{ opacity: 0, transition: "opacity .18s" }}
          />

          {/* ---------- nós ---------- */}
          {NOS.map((no) => {
            const e = estados[no.id] ?? "espera";
            const cor = CORES[no.tipo];
            // Sub-nó é menor e tem tipografia reduzida — a hierarquia visual
            // é o que diz "isto pertence ao agente" antes de qualquer texto.
            const L = no.filho ? LARGURA_FILHO : LARGURA_NO;
            const A = no.filho ? ALTURA_FILHO : ALTURA_NO;
            const apagado = e === "pulado";
            const barrado = e === "barrado";
            const rodandoEste = e === "rodando";

            return (
              <g key={no.id} opacity={apagado ? 0.25 : 1} className="transition-opacity duration-300">
                {/* halo de execução */}
                {rodandoEste ? (
                  <rect
                    x={no.x - 5}
                    y={no.y - 5}
                    width={L + 10}
                    height={A + 10}
                    rx="12"
                    fill="none"
                    stroke="var(--color-iris)"
                    strokeWidth="2"
                    opacity="0.6"
                  />
                ) : null}

                <rect
                  x={no.x}
                  y={no.y}
                  width={L}
                  height={A}
                  rx="9"
                  fill="var(--color-surface)"
                  stroke={
                    barrado
                      ? "var(--color-bad)"
                      : rodandoEste
                        ? "var(--color-iris)"
                        : e === "ok"
                          ? "var(--color-ok)"
                          : "var(--color-hairline)"
                  }
                  strokeWidth={rodandoEste || barrado ? 2 : 1.2}
                  className="transition-[stroke] duration-300"
                />

                {/* faixa de cor do tipo, como a lateral colorida dos nós do n8n */}
                <rect x={no.x} y={no.y} width="4" height={A} rx="2" fill={cor} />

                {/* ícone */}
                <g
                  transform={`translate(${no.x + (no.filho ? 11 : 14)}, ${no.y + (no.filho ? 11 : 16)}) scale(${no.filho ? 0.72 : 0.95})`}
                >
                  <path d={ICONES[no.tipo]} fill={cor} />
                </g>

                <text
                  x={no.x + (no.filho ? 36 : 48)}
                  y={no.y + (no.filho ? 19 : 24)}
                  className={`fill-bone font-mono font-semibold ${no.filho ? "text-[10px]" : "text-[13px]"}`}
                >
                  {no.titulo}
                </text>
                <text
                  x={no.x + (no.filho ? 36 : 48)}
                  y={no.y + (no.filho ? 31 : 40)}
                  className={`fill-muted font-mono ${no.filho ? "text-[9px]" : "text-[10px]"}`}
                >
                  {no.sub}
                </text>

                {/* selo de bloqueado */}
                {barrado ? (
                  <g>
                    <rect
                      x={no.x + L - 46}
                      y={no.y - 10}
                      width="52"
                      height="18"
                      rx="9"
                      fill="var(--color-bad)"
                    />
                    <text
                      x={no.x + L - 20}
                      y={no.y + 3}
                      textAnchor="middle"
                      className="fill-void font-mono text-[10px] font-bold uppercase"
                    >
                      {t(demos.automacao.barrouSelo)}
                    </text>
                  </g>
                ) : null}

                {/* bolinha de concluído */}
                {e === "ok" ? (
                  <circle cx={no.x + L - 10} cy={no.y + 10} r="4" fill="var(--color-ok)" />
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>

      {/* ---------- console de execução ---------- */}
      <div className="scroll-slim max-h-[190px] min-h-[120px] overflow-y-auto rounded-xl border border-hairline bg-void/70 p-4 font-mono text-[0.8125rem] leading-relaxed">
        {registros.length === 0 ? (
          <p className="m-0 text-muted">{t(demos.automacao.logVazio)}</p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {registros.map((r, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="shrink-0 text-muted">{String(i + 1).padStart(2, "0")}</span>
                <span
                  className={
                    r.tom === "alerta"
                      ? "text-bad"
                      : r.tom === "decisao"
                        ? "text-iris-soft"
                        : "text-bone"
                  }
                >
                  {r.texto}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
