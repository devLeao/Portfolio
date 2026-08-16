"use client";

/**
 * Assinatura do hero.
 *
 * Honestidade sobre o que isto é: um monograma desenhado por mim, não o
 * traçado real do Leandro. Para trocar pelo de verdade, exporte a assinatura
 * como SVG de traço único (não preenchido) e substitua os `d` abaixo —
 * `pathLength="1"` faz a animação continuar funcionando sem recalcular nada.
 *
 * `pathLength="1"` normaliza cada traço: dasharray e dashoffset viram 1,
 * independentemente do comprimento real do caminho. Sem isso, cada traço
 * precisaria de um valor próprio medido em JS.
 */

const TRACOS = [
  // L maiúsculo com laçada
  "M28 74C22 44 34 16 52 14c12-1 14 12 6 26-10 18-28 28-40 32 16 4 44 2 68-6",
  // segundo L, menor, entrando por baixo
  "M96 70c-4-22 4-44 18-45 9-1 10 10 3 22-8 13-21 20-29 22 14 4 40 1 60-7",
  // til do ã, solto como num rabisco rápido
  "M158 44c6-6 12 4 18-2",
  // swash de baixo, o traço que fecha a assinatura
  "M20 84c50 8 130 6 194-8 10-2 18-6 22-10",
];

export default function Signature({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 260 96"
      fill="none"
      role="img"
      aria-label="Leandro Leão"
      className={`overflow-visible ${className}`}
    >
      {TRACOS.map((d, i) => (
        <path
          key={d}
          d={d}
          pathLength="1"
          stroke="currentColor"
          strokeWidth={i === 3 ? 1.6 : 2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="motion-ambient [animation:assinar_1.1s_ease-out_forwards]"
          style={{
            strokeDasharray: 1,
            strokeDashoffset: 1,
            animationDelay: `${0.9 + i * 0.28}s`,
          }}
        />
      ))}

      {/* Keyframes locais: a animação só existe aqui, não polui o globals. */}
      {/* Keyframes locais: a animação só existe aqui, não polui o globals.
          As duas regras de movimento reduzido seguem o mesmo contrato do
          globals.css — a preferência do sistema só vale enquanto a pessoa
          não tiver pedido para ver com animação. */}
      <style>{`
        @keyframes assinar { to { stroke-dashoffset: 0; } }
        @media (prefers-reduced-motion: reduce) {
          html:not([data-motion="completo"]) svg path { stroke-dashoffset: 0 !important; }
        }
        html[data-motion="reduzido"] svg path { stroke-dashoffset: 0 !important; }
      `}</style>
    </svg>
  );
}
