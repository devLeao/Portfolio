"use client";

import { useEffect, useRef } from "react";
import Portal from "@/components/sections/Portal";
import Playground from "@/components/sections/Playground";
import Arcade from "@/components/sections/Arcade";

/**
 * O mundo pixel inteiro — portal de ida, playground, portal de volta.
 *
 * O céu é UMA peça só, atrás dos três blocos. Cada um pintando o próprio
 * gradiente deixava duas emendas visíveis no meio da rolagem: o portal
 * terminava em `--color-sky-base` e o playground recomeçava em
 * `--color-sky-top`, e a diferença aparecia como uma faixa horizontal.
 *
 * Os portais só desenham a cortina escura por cima. O céu está sempre aqui;
 * eles decidem o quanto dele já dá para ver.
 *
 * As NUVENS, ao contrário do gradiente, ficam em cada bloco. Espalhadas por
 * este contêiner de ~5 viewports, a faixa de altura em que elas podem nascer
 * cai toda dentro do portal de entrada e o playground fica com um céu limpo
 * e sem graça. Por bloco, cada trecho ganha o seu próprio céu.
 */
export default function PixelWorld() {
  const raiz = useRef<HTMLDivElement>(null);

  /*
   * Avisa o resto da página que estamos no outro mundo.
   *
   * Quem escuta é o cursor: ele troca o rastro neon por quadrados na grade
   * ao entrar aqui. Um atributo no `<body>` em vez de contexto porque o
   * cursor vive fora desta árvore e não deve re-renderizar por causa disso.
   */
  useEffect(() => {
    const el = raiz.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entrada]) => {
        if (entrada?.isIntersecting) document.body.dataset.mundo = "pixel";
        else delete document.body.dataset.mundo;
      },
      // Só conta como "dentro" quando o mundo pixel domina a tela.
      { threshold: 0, rootMargin: "-40% 0px -40% 0px" }
    );

    io.observe(el);
    return () => {
      io.disconnect();
      delete document.body.dataset.mundo;
    };
  }, []);

  return (
    <div
      ref={raiz}
      className="relative bg-gradient-to-b from-sky-top via-sky-base to-sky-top"
    >
      <Portal sentido="entrada" />
      <Playground />
      <Arcade />
      <Portal sentido="saida" />
    </div>
  );
}
