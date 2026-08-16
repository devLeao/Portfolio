"use client";

import { useMemo, useState } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { demos } from "@/content/content";

/**
 * Painel de carteira — análise de dados demonstrada, não descrita.
 *
 * A tabela inteira está neste arquivo, e cada consulta roda DE VERDADE sobre
 * ela em JavaScript: os KPIs, as barras e a rosca são todos derivados no
 * momento do clique. Nenhum número está escrito à mão.
 *
 * Por que não SQL.js (SQLite em WebAssembly): 1,2MB de WASM para nove linhas
 * e cinco perguntas. O que a seção precisa mostrar é o raciocínio da análise
 * — quais perguntas valem a pena e como o resultado vira decisão — não a
 * existência de um parser de SQL.
 */

type Pedido = {
  cliente: string;
  regiao: "Sudeste" | "Sul" | "Nordeste";
  valor: number;
  atrasoDias: number;
  status: "pago" | "vencido";
};

const PEDIDOS: Pedido[] = [
  { cliente: "Alfa Log", regiao: "Sudeste", valor: 128_400, atrasoDias: 0, status: "pago" },
  { cliente: "Beta Foods", regiao: "Nordeste", valor: 92_150, atrasoDias: 47, status: "vencido" },
  { cliente: "Cedro SA", regiao: "Sul", valor: 64_900, atrasoDias: 12, status: "vencido" },
  { cliente: "Delta Peças", regiao: "Sudeste", valor: 210_300, atrasoDias: 93, status: "vencido" },
  { cliente: "Even Tech", regiao: "Sudeste", valor: 45_700, atrasoDias: 0, status: "pago" },
  { cliente: "Fluxo Bebidas", regiao: "Nordeste", valor: 156_800, atrasoDias: 61, status: "vencido" },
  { cliente: "Grão Norte", regiao: "Sul", valor: 38_200, atrasoDias: 0, status: "pago" },
  { cliente: "Hexa Móveis", regiao: "Sudeste", valor: 174_500, atrasoDias: 128, status: "vencido" },
  { cliente: "Íris Serviços", regiao: "Sul", valor: 71_600, atrasoDias: 22, status: "vencido" },
];

type Linha = { rotulo: string; valor: number; nota?: string; alerta?: boolean };

type Consulta = {
  id: string;
  sql: string;
  rodar: () => Linha[];
  unidade: "reais" | "dias";
};

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const compacto = (n: number) =>
  n >= 1000 ? `R$ ${(n / 1000).toFixed(0)}k` : `R$ ${n}`;

const CONSULTAS: Consulta[] = [
  {
    id: "regiao",
    unidade: "reais",
    sql: "SELECT regiao, SUM(valor)\n  FROM pedidos\n WHERE status = 'vencido'\n GROUP BY regiao\n ORDER BY 2 DESC;",
    rodar: () => {
      const mapa = new Map<string, number>();
      for (const p of PEDIDOS) {
        if (p.status !== "vencido") continue;
        mapa.set(p.regiao, (mapa.get(p.regiao) ?? 0) + p.valor);
      }
      return [...mapa.entries()]
        .map(([rotulo, valor]) => ({ rotulo, valor }))
        .sort((a, b) => b.valor - a.valor);
    },
  },
  {
    id: "top",
    unidade: "reais",
    sql: "SELECT cliente, valor, atraso_dias\n  FROM pedidos\n WHERE atraso_dias > 60\n ORDER BY valor DESC;",
    rodar: () =>
      PEDIDOS.filter((p) => p.atrasoDias > 60)
        .sort((a, b) => b.valor - a.valor)
        .map((p) => ({
          rotulo: p.cliente,
          valor: p.valor,
          nota: `${p.atrasoDias}d`,
          alerta: p.atrasoDias > 90,
        })),
  },
  {
    id: "faixa",
    unidade: "reais",
    sql: "SELECT faixa_atraso, SUM(valor)\n  FROM pedidos\n WHERE status = 'vencido'\n GROUP BY faixa_atraso;",
    rodar: () => {
      const faixas: Record<string, number> = { "1–30d": 0, "31–90d": 0, "90d+": 0 };
      for (const p of PEDIDOS) {
        if (p.status !== "vencido") continue;
        const chave = p.atrasoDias <= 30 ? "1–30d" : p.atrasoDias <= 90 ? "31–90d" : "90d+";
        faixas[chave] = (faixas[chave] ?? 0) + p.valor;
      }
      return Object.entries(faixas).map(([rotulo, valor]) => ({
        rotulo,
        valor,
        alerta: rotulo === "90d+",
      }));
    },
  },
  {
    id: "media",
    unidade: "dias",
    sql: "SELECT regiao, AVG(atraso_dias)\n  FROM pedidos\n WHERE status = 'vencido'\n GROUP BY regiao\n ORDER BY 2 DESC;",
    rodar: () => {
      const soma = new Map<string, { total: number; n: number }>();
      for (const p of PEDIDOS) {
        if (p.status !== "vencido") continue;
        const atual = soma.get(p.regiao) ?? { total: 0, n: 0 };
        soma.set(p.regiao, { total: atual.total + p.atrasoDias, n: atual.n + 1 });
      }
      return [...soma.entries()]
        .map(([rotulo, { total, n }]) => ({ rotulo, valor: Math.round(total / n) }))
        .sort((a, b) => b.valor - a.valor);
    },
  },
];

/** Rosca de pago × vencido. Duas fatias — mais que isso vira pizza ilegível. */
function Rosca({ pago, vencido }: { pago: number; vencido: number }) {
  const total = pago + vencido || 1;
  const fracao = vencido / total;
  const R = 42;
  const perimetro = 2 * Math.PI * R;

  return (
    <svg viewBox="0 0 110 110" className="size-[110px] shrink-0" aria-hidden="true">
      <circle cx="55" cy="55" r={R} fill="none" stroke="var(--color-hairline)" strokeWidth="14" />
      {/* -90° para a fatia começar no topo, que é onde o olho procura. */}
      <circle
        cx="55"
        cy="55"
        r={R}
        fill="none"
        stroke="var(--color-bad)"
        strokeWidth="14"
        strokeDasharray={`${perimetro * fracao} ${perimetro}`}
        transform="rotate(-90 55 55)"
        className="transition-[stroke-dasharray] duration-700"
      />
      <text
        x="55"
        y="52"
        textAnchor="middle"
        className="fill-bone font-mono text-[17px] font-semibold"
      >
        {Math.round(fracao * 100)}%
      </text>
      <text x="55" y="68" textAnchor="middle" className="fill-muted font-mono text-[9px]">
        vencido
      </text>
    </svg>
  );
}

export default function SqlDemo() {
  const { t } = useLocale();
  const [ativa, setAtiva] = useState(0);

  const consulta = CONSULTAS[ativa] ?? CONSULTAS[0];
  const resultado = useMemo(() => consulta?.rodar() ?? [], [consulta]);
  const maximo = Math.max(...resultado.map((r) => r.valor), 1);

  /** KPIs do topo — derivados da mesma tabela, não digitados. */
  const kpis = useMemo(() => {
    const total = PEDIDOS.reduce((s, p) => s + p.valor, 0);
    const vencido = PEDIDOS.filter((p) => p.status === "vencido");
    const emAberto = vencido.reduce((s, p) => s + p.valor, 0);
    const critico = vencido
      .filter((p) => p.atrasoDias > 90)
      .reduce((s, p) => s + p.valor, 0);
    const medio = Math.round(
      vencido.reduce((s, p) => s + p.atrasoDias, 0) / (vencido.length || 1)
    );
    return { total, emAberto, critico, medio, pago: total - emAberto };
  }, []);

  if (!consulta) return null;

  return (
    <div className="rounded-xl border border-hairline bg-surface/40 p-4 md:p-6">
      {/* ---------- faixa de KPIs ----------
          Painel bom abre com o número que decide, não com a tabela. */}
      <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 lg:grid-cols-4">
        {[
          { rot: demos.sql.kpiCarteira, val: compacto(kpis.total), cor: "text-bone" },
          { rot: demos.sql.kpiAberto, val: compacto(kpis.emAberto), cor: "text-iris-soft" },
          { rot: demos.sql.kpiCritico, val: compacto(kpis.critico), cor: "text-bad" },
          { rot: demos.sql.kpiMedio, val: `${kpis.medio}d`, cor: "text-bone" },
        ].map((k) => (
          <li key={k.val + k.cor} className="rounded-lg border border-hairline bg-void/50 p-3">
            <p className={`m-0 font-mono text-[1.375rem] leading-none tabular-nums ${k.cor}`}>
              {k.val}
            </p>
            <p className="label m-0 mt-2 leading-snug">{t(k.rot)}</p>
          </li>
        ))}
      </ul>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-6">
        {/* ---------- consulta ---------- */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {CONSULTAS.map((c, i) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setAtiva(i)}
                aria-pressed={i === ativa}
                className={`rounded-full border px-3 py-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.1em] transition-colors ${
                  i === ativa
                    ? "border-iris bg-[var(--iris-veil)] text-bone"
                    : "border-hairline text-muted hover:text-bone"
                }`}
              >
                {t(demos.sql.perguntas[i] ?? demos.sql.perguntas[0]!)}
              </button>
            ))}
          </div>

          <pre className="scroll-slim m-0 overflow-x-auto rounded-lg border border-hairline bg-void/70 p-4 font-mono text-[0.8125rem] leading-relaxed text-bone">
            <code>{consulta.sql}</code>
          </pre>

          <div className="flex items-center gap-4 rounded-lg border border-hairline bg-void/50 p-3">
            <Rosca pago={kpis.pago} vencido={kpis.emAberto} />
            <p className="m-0 text-xs leading-relaxed text-muted">
              {t(demos.sql.notaRosca)}
            </p>
          </div>
        </div>

        {/* ---------- resultado ----------
            Número e barra juntos: o número responde a pergunta, a barra
            mostra a proporção. Painel que dá só um dos dois obriga o leitor
            a fazer a conta de cabeça. */}
        <div className="rounded-lg border border-hairline bg-void/50 p-4">
          <p className="label m-0 mb-4 flex items-center justify-between">
            <span>{t(demos.sql.resultado)}</span>
            <span className="tabular-nums">
              {resultado.length} {t(demos.sql.linhas)}
            </span>
          </p>

          <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
            {resultado.map((r) => (
              <li key={r.rotulo} className="group flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="flex items-center gap-2 text-sm text-bone">
                    {r.alerta ? (
                      <span
                        aria-hidden="true"
                        className="size-1.5 shrink-0 rounded-full bg-bad"
                      />
                    ) : null}
                    {r.rotulo}
                    {r.nota ? (
                      <span className={`text-xs ${r.alerta ? "text-bad" : "text-muted"}`}>
                        {r.nota}
                      </span>
                    ) : null}
                  </span>
                  <span className="font-mono text-sm tabular-nums text-iris-soft">
                    {consulta.unidade === "reais" ? brl(r.valor) : `${r.valor} dias`}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-hairline">
                  <div
                    className={`h-full rounded-full transition-[width] duration-700 ${
                      r.alerta ? "bg-bad" : "bg-iris"
                    }`}
                    style={{ width: `${(r.valor / maximo) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>

          <p className="m-0 mt-5 border-t border-hairline pt-3 text-xs leading-relaxed text-muted">
            {t(demos.sql.leitura[ativa] ?? demos.sql.leitura[0]!)}
          </p>
        </div>
      </div>
    </div>
  );
}
