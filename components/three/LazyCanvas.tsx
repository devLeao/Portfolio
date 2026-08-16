"use client";

import { useEffect, useState } from "react";
import { useInViewport, useIsMobile } from "@/lib/hooks";

/**
 * Adiar a MONTAGEM do canvas, não só o import da cena.
 *
 * O erro que isto conserta: `import { Canvas } from "@react-three/fiber"` no
 * topo de um componente que a página renderiza de saída coloca o three inteiro
 * no bundle inicial. O `next/dynamic` da cena não ajudava — o `Canvas` já
 * tinha arrastado a biblioteca junto. Resultado no Lighthouse: uma tarefa
 * longa de 1,6s antes da primeira pintura e TBT de 2,4s.
 *
 * Aqui NENHUM módulo do three é importado. O que existe é uma caixa com a
 * altura final reservada (por isso não há deslocamento de layout) e dois
 * gatilhos que precisam concordar:
 *
 * 1. PERTO — a caixa chegou perto da viewport. Margem generosa: o download
 *    precisa começar antes de a seção aparecer, senão a pessoa vê o esqueleto.
 *    É uma trava de mão única (`useInViewport(..., true)`): uma vez montado,
 *    o canvas NUNCA desmonta. Sair da tela e desmontar destruía o contexto
 *    WebGL, e a cena tinha que ser reconstruída do zero na volta — o teclado
 *    das skills sumindo na rolagem era isto. A explicação longa está no
 *    próprio hook.
 *
 * 2. OCIOSO — a thread principal já está livre. Este é o gatilho que importa
 *    para o TBT: o avatar do hero está na viewport desde o primeiro quadro,
 *    então só a condição de viewport montaria o three no meio da hidratação e
 *    travaria a página por ~2s num celular. Com `requestIdleCallback`, o
 *    three só entra depois de a página ficar utilizável.
 *
 * O `timeout` garante que a cena aparece mesmo numa aba que nunca fica ociosa.
 */
export default function LazyCanvas({
  children,
  className = "",
  esqueleto,
  margem = "900px",
}: {
  children: React.ReactNode;
  className?: string;
  esqueleto: React.ReactNode;
  margem?: string;
}) {
  const [ref, perto] = useInViewport<HTMLDivElement>(margem, true);
  const [ocioso, setOcioso] = useState(false);
  const mobile = useIsMobile();
  const [interagiu, setInteragiu] = useState(false);

  /*
   * No celular, um terceiro gatilho: a primeira interação.
   *
   * Carregar o three custa ~1,8s de thread principal num aparelho mediano.
   * Gastar isso ANTES de a pessoa fazer qualquer coisa é gastar no pior
   * momento possível — e no mobile o avatar do hero fica abaixo da dobra, ou
   * seja, ninguém está olhando para ele durante essa espera.
   *
   * Rolar, tocar ou apertar uma tecla libera. O `timeout` cobre quem chega e
   * fica parado lendo.
   */
  useEffect(() => {
    if (!mobile) {
      setInteragiu(true);
      return;
    }

    const liberar = () => setInteragiu(true);
    const eventos = ["scroll", "pointerdown", "keydown"] as const;
    eventos.forEach((e) => window.addEventListener(e, liberar, { passive: true, once: true }));

    /*
     * Rede de segurança para quem chega e fica lendo sem rolar. Já foram dez
     * segundos, e era tempo demais: a cena aparecia quando ninguém esperava
     * mais por ela. Três segundos e meio ainda protegem o carregamento
     * inicial e não deixam o esqueleto virar a experiência.
     */
    const id = window.setTimeout(liberar, 3500);

    return () => {
      eventos.forEach((e) => window.removeEventListener(e, liberar));
      window.clearTimeout(id);
    };
  }, [mobile]);

  useEffect(() => {
    type ComIdle = {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const w = window as unknown as ComIdle;

    // Safari só ganhou `requestIdleCallback` recentemente; o setTimeout cobre
    // o resto sem mudar o comportamento de forma perceptível.
    if (!w.requestIdleCallback) {
      const id = window.setTimeout(() => setOcioso(true), 250);
      return () => window.clearTimeout(id);
    }

    const id = w.requestIdleCallback(() => setOcioso(true), { timeout: 500 });
    return () => w.cancelIdleCallback?.(id);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {perto && ocioso && interagiu ? children : esqueleto}
    </div>
  );
}
