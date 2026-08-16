"use client";

/**
 * Faixa rolante do nome.
 *
 * O conteúdo é duplicado e a animação anda -50%: quando a primeira cópia
 * termina de sair, a segunda está exatamente onde a primeira começou, e o
 * laço não tem emenda. Com uma cópia só, sobra um vão a cada volta.
 */
export default function Marquee({ texto }: { texto: string }) {
  const itens = Array.from({ length: 6 }, (_, i) => i);

  return (
    <div
      aria-hidden="true"
      className="relative flex overflow-hidden border-y border-hairline py-6 select-none"
    >
      <div className="motion-ambient flex shrink-0 animate-marquee">
        {[0, 1].map((copia) => (
          <div key={copia} className="flex shrink-0">
            {itens.map((i) => (
              <span
                key={i}
                className="display-lg flex shrink-0 items-center gap-8 whitespace-nowrap px-8 text-muted/50"
              >
                {texto}
                <span className="text-iris">✳</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
