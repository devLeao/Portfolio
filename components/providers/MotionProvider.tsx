"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useMediaQuery } from "@/lib/hooks";

/**
 * Quem decide se o site se mexe.
 *
 * O sistema operacional dá a preferência; a pessoa dá a palavra final.
 *
 * Isso existe por um caso real: o Windows tem "Mostrar animações" desligado
 * em muita máquina — às vezes por escolha, muitas vezes porque veio assim ou
 * porque alguém desligou para ganhar desempenho anos atrás. O navegador
 * traduz aquilo em `prefers-reduced-motion: reduce`, e o site inteiro entrega
 * a versão congelada. Quem realmente tem sensibilidade vestibular precisa
 * disso; quem só tem uma configuração antiga esquecida vê um portfólio morto
 * e conclui que foi feito com HTML e CSS.
 *
 * Então: respeitar por padrão, sempre. E oferecer um botão discreto para
 * quem quiser ver o outro lado — a escolha fica salva.
 *
 * O atributo `data-motion` no `<html>` é o que permite o CSS seguir a mesma
 * decisão; sem ele, as regras `@media (prefers-reduced-motion)` continuariam
 * valendo por baixo e o override só funcionaria pela metade.
 */

type Ctx = {
  /** Valor efetivo: é isto que todo componente deve consultar. */
  reduzido: boolean;
  /** O SO pediu menos movimento? Usado só para decidir se mostra o convite. */
  pedidoDoSistema: boolean;
  /** A pessoa já escolheu explicitamente? */
  escolheu: boolean;
  definir: (reduzido: boolean) => void;
};

const MotionCtx = createContext<Ctx>({
  reduzido: false,
  pedidoDoSistema: false,
  escolheu: false,
  definir: () => {},
});

const CHAVE = "leandro:movimento";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const pedidoDoSistema = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [escolha, setEscolha] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const salvo = window.localStorage.getItem(CHAVE);
      if (salvo === "completo") setEscolha(false);
      else if (salvo === "reduzido") setEscolha(true);
    } catch {
      /* modo privado bloqueia storage — segue a preferência do sistema */
    }
  }, []);

  const reduzido = escolha ?? pedidoDoSistema;

  const definir = useCallback((valor: boolean) => {
    setEscolha(valor);
    try {
      window.localStorage.setItem(CHAVE, valor ? "reduzido" : "completo");
    } catch {
      /* idem */
    }
  }, []);

  // O CSS precisa saber da decisão tanto quanto o JS.
  useEffect(() => {
    document.documentElement.dataset.motion = reduzido ? "reduzido" : "completo";
  }, [reduzido]);

  const valor = useMemo<Ctx>(
    () => ({ reduzido, pedidoDoSistema, escolheu: escolha !== null, definir }),
    [reduzido, pedidoDoSistema, escolha, definir]
  );

  return <MotionCtx.Provider value={valor}>{children}</MotionCtx.Provider>;
}

/**
 * O valor efetivo de movimento reduzido. Mesmo nome de antes de propósito:
 * os componentes não precisam saber que agora existe um override no meio.
 */
export function usePrefersReducedMotion(): boolean {
  return useContext(MotionCtx).reduzido;
}

export function useMotion(): Ctx {
  return useContext(MotionCtx);
}
