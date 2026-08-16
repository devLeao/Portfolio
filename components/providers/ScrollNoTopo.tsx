"use client";

import { useEffect } from "react";

/**
 * Recarregar a página abre ela no TOPO.
 *
 * ---------- o problema ----------
 * O navegador guarda a posição da rolagem e restaura sozinho no reload
 * (`history.scrollRestoration === "auto"`, o padrão). Numa página comum isso
 * é bom. Aqui não é, por dois motivos que se somam:
 *
 * 1. A altura muda depois do primeiro paint. Fontes chegam, o mundo pixel
 *    monta seu céu, os `ScrollTrigger` recalculam, e o documento cresce
 *    alguns milhares de pixels. O navegador restaura a posição ANTES disso,
 *    então o mesmo número de pixels cai num lugar completamente diferente da
 *    página — foi por isso que voltar ao topo e recarregar largava você no
 *    meio.
 *
 * 2. O Lenis interpola a rolagem e tem a própria noção de posição. Ele e a
 *    restauração do navegador brigam pelo mesmo valor no primeiro segundo.
 *
 * ---------- a correção ----------
 * Assumir a responsabilidade: desligar a restauração automática e ir para o
 * topo. Um portfólio é lido do começo, então não se perde nada — e ganha-se
 * a garantia de que o hero é sempre a primeira coisa que aparece.
 *
 * A âncora na URL (`/pt#skills`) continua funcionando: se existe hash, ele
 * manda, e nós não mexemos.
 */
export default function ScrollNoTopo() {
  useEffect(() => {
    if (!("scrollRestoration" in window.history)) return;

    const anterior = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    if (!window.location.hash) {
      // `instant` e não `smooth`: no carregamento, animar a volta ao topo
      // mostraria justamente o pedaço errado da página antes de corrigir.
      window.scrollTo({ top: 0, behavior: "instant" });

      /*
       * E de novo depois que a página assenta. A altura ainda cresce depois
       * do primeiro quadro (fontes, céu do mundo pixel, refresh do
       * ScrollTrigger), e alguns navegadores reaplicam a posição salva nesse
       * meio-tempo. Uma segunda ida ao topo custa nada e fecha a brecha.
       */
      const id = window.setTimeout(() => {
        if (!window.location.hash) window.scrollTo({ top: 0, behavior: "instant" });
      }, 220);

      return () => {
        window.clearTimeout(id);
        window.history.scrollRestoration = anterior;
      };
    }

    return () => {
      window.history.scrollRestoration = anterior;
    };
  }, []);

  return null;
}
