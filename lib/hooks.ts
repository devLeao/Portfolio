"use client";

import { useEffect, useRef, useState } from "react";

/** Media query com assinatura estável para SSR (sempre `false` no servidor). */
export function useMediaQuery(query: string): boolean {
  const [bate, setBate] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const aplicar = () => setBate(mql.matches);
    aplicar();
    mql.addEventListener("change", aplicar);
    return () => mql.removeEventListener("change", aplicar);
  }, [query]);

  return bate;
}

/*
 * `usePrefersReducedMotion` NÃO mora mais aqui.
 *
 * A preferência do sistema deixou de ser a palavra final: a pessoa pode
 * pedir para ver o site com movimento mesmo com a configuração ligada. Quem
 * responde isso agora é o `MotionProvider`, que combina o sistema com a
 * escolha salva. Deixar uma cópia crua aqui seria garantir que algum
 * componente futuro consultasse a fonte errada.
 */

export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}

/** `true` quando o ponteiro é fino e existe hover de verdade. */
export function useHasHover(): boolean {
  return useMediaQuery("(hover: hover) and (pointer: fine)");
}

/**
 * Visibilidade de um elemento na viewport. É isto que desliga o `useFrame`
 * dos canvases 3D quando eles saem da tela — sem isso, três cenas ficam
 * renderizando ao mesmo tempo e o notebook decola.
 */
export function useInViewport<T extends Element>(
  margin = "200px",
  /**
   * Uma vez visível, nunca mais volta a `false` — e o observador se desliga.
   *
   * É o que o `LazyCanvas` usa. A diferença não é otimização: sem a trava, o
   * elemento saindo da tela desmonta o canvas e DESTRÓI o contexto WebGL
   * junto. Na volta, a cena inteira precisa ser reconstruída — e enquanto
   * isso o lugar dela fica vazio. Era o teclado das skills que "às vezes não
   * aparecia" na rolagem.
   *
   * Pior: o navegador limita quantos contextos WebGL existem ao mesmo tempo
   * (~16) e derruba os mais antigos em silêncio quando o limite estoura.
   * Criar e destruir contexto a cada passagem pela seção é o caminho mais
   * curto para esse limite, o que explica o "às vezes".
   *
   * Manter montado não custa quadro nenhum: quem cuida disso é o
   * `frameloop="demand"`, que já responde à visibilidade separadamente.
   */
  travar = false
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const alvo = ref.current;
    if (!alvo) return;

    const io = new IntersectionObserver(
      ([entrada]) => {
        const dentro = Boolean(entrada?.isIntersecting);
        if (!dentro && travar) return;
        setVisivel(dentro);
        if (dentro && travar) io.disconnect();
      },
      { rootMargin: margin }
    );

    io.observe(alvo);
    return () => io.disconnect();
  }, [margin, travar]);

  return [ref, visivel];
}

/** `false` quando a aba está em segundo plano — mais um freio de render. */
export function useTabVisible(): boolean {
  const [visivel, setVisivel] = useState(true);

  useEffect(() => {
    const aplicar = () => setVisivel(!document.hidden);
    aplicar();
    document.addEventListener("visibilitychange", aplicar);
    return () => document.removeEventListener("visibilitychange", aplicar);
  }, []);

  return visivel;
}

/** Progresso de rolagem da página inteira, 0..1. Usado pelo avatar do hero. */
export function useScrollProgress(): React.RefObject<number> {
  const progresso = useRef(0);

  useEffect(() => {
    const aplicar = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      progresso.current = total > 0 ? window.scrollY / total : 0;
    };
    aplicar();
    window.addEventListener("scroll", aplicar, { passive: true });
    window.addEventListener("resize", aplicar);
    return () => {
      window.removeEventListener("scroll", aplicar);
      window.removeEventListener("resize", aplicar);
    };
  }, []);

  return progresso;
}
