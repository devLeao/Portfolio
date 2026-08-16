"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

/**
 * Força um quadro quando a cena volta a aparecer.
 *
 * ---------- o bug que isto conserta ----------
 * O `frameloop` estava indo para `"never"` quando o canvas saía da viewport.
 * Parece a economia certa — e é, do ponto de vista de CPU. O problema é o
 * `preserveDrawingBuffer: false` (o padrão, e o que se quer por desempenho):
 * sem ele, o navegador pode descartar o buffer de desenho a qualquer momento
 * depois que o loop para. Ao voltar, o canvas está VAZIO e só se repinta no
 * próximo quadro — que em `"never"` nunca chega.
 *
 * O sintoma era exatamente o relatado: rolar de volta para o teclado ou para
 * o avatar e encontrar um retângulo em branco que demora a acordar.
 *
 * A correção tem duas partes, e as duas precisam existir:
 *
 * 1. Nunca usar `"never"`. Fora da viewport a cena fica em `"demand"`, que
 *    também não gasta quadro nenhum, mas mantém o loop capaz de atender um
 *    pedido.
 * 2. Pedir esse quadro na hora certa. É o que este componente faz —
 *    `invalidate()` na montagem e sempre que a visibilidade muda.
 *
 * Dois quadros e não um: o primeiro reconstrói o buffer, o segundo garante
 * que sombras de contato e `Environment` (que renderizam uma vez) já estejam
 * dentro dele.
 */
export default function Invalidar({ quando }: { quando: unknown }) {
  const invalidate = useThree((e) => e.invalidate);

  useEffect(() => {
    invalidate();
    const id = requestAnimationFrame(() => invalidate());
    return () => cancelAnimationFrame(id);
  }, [invalidate, quando]);

  return null;
}
