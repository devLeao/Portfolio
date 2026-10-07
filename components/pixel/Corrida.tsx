"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useSound } from "@/components/providers/SoundProvider";
import { useHasHover, useInViewport, useTabVisible } from "@/lib/hooks";
import { arcade } from "@/content/content";
import { CORES } from "./corrida/cores";
import type { Controles, Hud, Resultado } from "./corrida/CorridaCena";

/**
 * Corrida noturna — o lado de fora da cena 3D.
 *
 * Este arquivo não importa o three. A cena entra por `next/dynamic` só depois
 * do clique em "jogar": antes disso, a seção custa um botão. É a mesma regra
 * do `LazyCanvas`, levada um passo adiante — aqui nem a proximidade da
 * viewport basta, porque um jogo que ninguém abriu não merece 600 KB.
 *
 * O HUD é HTML por cima do canvas, não texto 3D: fica nítido na resolução
 * reduzida da cena, e o React só o atualiza a 10 quadros por segundo.
 */

const Cena = dynamic(() => import("./corrida/CorridaCena"), { ssr: false });

const CHAVE_RECORDE = "leandro:corrida3d:melhor-volta";

type Fase = "capa" | "jogando" | "fim";

const TECLAS: Record<string, keyof Controles> = {
  arrowup: "gas",
  w: "gas",
  arrowdown: "freio",
  s: "freio",
  arrowleft: "esq",
  a: "esq",
  arrowright: "dir",
  d: "dir",
};

function relogio(seg: number): string {
  if (!Number.isFinite(seg)) return "—";
  const m = Math.floor(seg / 60);
  const s = seg - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, "0")}`;
}

function lerRecorde(): number {
  try {
    const v = Number(localStorage.getItem(CHAVE_RECORDE));
    return v > 0 ? v : Infinity;
  } catch {
    return Infinity;
  }
}

export default function Corrida() {
  const { t } = useLocale();
  const { tocar, motorLigar, motorAjustar, motorDesligar, musicaLigar, musicaDesligar } = useSound();
  const temHover = useHasHover();
  const [caixa, visivel] = useInViewport<HTMLDivElement>("0px");
  const abaVisivel = useTabVisible();

  const [fase, setFase] = useState<Fase>("capa");
  const [rodada, setRodada] = useState(0);
  const [hud, setHud] = useState<Hud | null>(null);
  const [mapa, setMapa] = useState<{ d: string; viewBox: string } | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [recorde, setRecorde] = useState(Infinity);
  const controles = useRef<Controles>({ gas: false, freio: false, esq: false, dir: false });

  useEffect(() => setRecorde(lerRecorde()), []);

  const ativo = fase !== "capa" && visivel && abaVisivel;
  const jogando = fase === "jogando" && ativo;

  const som = useMemo(
    () => ({ tocar, motorLigar, motorAjustar, motorDesligar }),
    [tocar, motorLigar, motorAjustar, motorDesligar]
  );

  // Música só enquanto se corre de verdade, e na tela.
  useEffect(() => {
    if (!jogando) return;
    musicaLigar();
    return () => musicaDesligar();
  }, [jogando, musicaLigar, musicaDesligar]);

  /* ---------- teclado ---------- */
  useEffect(() => {
    if (!jogando) return;
    const c = controles.current;
    const baixo = (e: KeyboardEvent) => {
      const acao = TECLAS[e.key.toLowerCase()];
      if (!acao) return;
      // Setas rolariam a página no meio da curva.
      e.preventDefault();
      c[acao] = true;
    };
    const cima = (e: KeyboardEvent) => {
      const acao = TECLAS[e.key.toLowerCase()];
      if (acao) c[acao] = false;
    };
    const soltar = () => Object.assign(c, { gas: false, freio: false, esq: false, dir: false });
    window.addEventListener("keydown", baixo);
    window.addEventListener("keyup", cima);
    window.addEventListener("blur", soltar);
    return () => {
      window.removeEventListener("keydown", baixo);
      window.removeEventListener("keyup", cima);
      window.removeEventListener("blur", soltar);
      soltar();
    };
  }, [jogando]);

  const onFim = useCallback((r: Resultado) => {
    setResultado(r);
    setFase("fim");
    if (Number.isFinite(r.melhorVolta)) {
      setRecorde((atual) => {
        const novo = Math.min(atual, r.melhorVolta);
        try {
          localStorage.setItem(CHAVE_RECORDE, String(novo));
        } catch {
          /* sem armazenamento, o recorde vale só por esta visita */
        }
        return novo;
      });
    }
  }, []);

  const comecar = () => {
    setResultado(null);
    setHud(null);
    if (fase !== "capa") setRodada((n) => n + 1);
    setFase("jogando");
  };

  const segurar = (acao: keyof Controles) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      controles.current[acao] = true;
    },
    onPointerUp: () => (controles.current[acao] = false),
    onPointerCancel: () => (controles.current[acao] = false),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  const botaoToque =
    "touch-none select-none border-2 border-cloud-gold/60 bg-transparent py-3 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-cloud-gold active:bg-cloud-gold active:text-sky-top";

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={caixa}
        className="relative aspect-[16/10] w-full overflow-hidden border-2 border-cloud-gold/60 bg-sky-top"
      >
        {fase !== "capa" ? (
          <>
            <div className="absolute inset-0">
              <Cena
                controles={controles}
                rodada={rodada}
                ativo={ativo}
                som={som}
                onHud={setHud}
                onFim={onFim}
                onMapa={setMapa}
              />
            </div>

            {!hud ? (
              <p className="pixel-body absolute inset-0 m-0 grid place-items-center text-cloud-rose">
                {t(arcade.corrida.carregando)}
              </p>
            ) : null}

            {hud ? (
              <div className="pointer-events-none absolute inset-0 p-2 sm:p-3" aria-live="off">
                <div className="flex items-start justify-between">
                  <p className="pixel-title m-0 text-[0.625rem] leading-relaxed text-bone sm:text-xs">
                    {t(arcade.corrida.volta)} {hud.volta}/3
                  </p>
                  <p className="pixel-title m-0 text-sm text-cloud-gold sm:text-lg">
                    {hud.posicao}º<span className="text-[0.625rem] text-bone/70">/4</span>
                  </p>
                </div>

                {hud.contagem !== null ? (
                  <p
                    className="pixel-title absolute inset-0 m-0 grid place-items-center text-[clamp(1.5rem,7vw,3.5rem)] text-cloud-gold"
                    style={{ textShadow: "0 0 18px rgb(251 191 36 / 0.6)" }}
                  >
                    {hud.contagem > 0 ? hud.contagem : t(arcade.corrida.largada)}
                  </p>
                ) : null}

                <div className="absolute inset-x-2 bottom-2 flex items-end justify-between sm:inset-x-3 sm:bottom-3">
                  {mapa ? (
                    <svg viewBox={mapa.viewBox} className="w-[22%] max-w-[120px] opacity-90" aria-hidden="true">
                      <path d={mapa.d} fill="none" stroke="#f5f1ea" strokeOpacity={0.5} strokeWidth={9} />
                      {Array.from({ length: hud.carros.length / 2 }, (_, k) => (
                        <circle
                          key={k}
                          cx={hud.carros[k * 2]}
                          cy={hud.carros[k * 2 + 1]}
                          r={k === 0 ? 11 : 8}
                          fill={CORES[k]}
                        />
                      ))}
                    </svg>
                  ) : (
                    <span />
                  )}
                  <p className="pixel-title m-0 text-right text-[0.625rem] leading-relaxed text-bone sm:text-xs">
                    {hud.kmh} km/h
                    <br />
                    <span className="text-cloud-rose">{relogio(hud.tempo)}</span>
                  </p>
                </div>
              </div>
            ) : null}
          </>
        ) : null}

        {fase !== "jogando" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-sky-top/90 p-4 text-center">
            {fase === "fim" && resultado ? (
              <>
                <p className="pixel-title m-0 text-sm leading-relaxed text-cloud-gold sm:text-base">
                  {t(arcade.corrida.chegada)} {resultado.posicao}º
                </p>
                <p className="pixel-body m-0 text-cloud-rose">
                  {t(arcade.corrida.tempo)} {relogio(resultado.tempo)} · {t(arcade.corrida.melhorVolta)}{" "}
                  {relogio(resultado.melhorVolta)}
                </p>
              </>
            ) : (
              <>
                <p className="pixel-title m-0 text-[0.625rem] leading-relaxed text-cloud-gold">
                  {t(arcade.corrida.nome)}
                </p>
                <p className="pixel-body m-0 max-w-[30ch] text-cloud-rose">{t(arcade.corrida.como)}</p>
              </>
            )}
            <button
              type="button"
              onClick={comecar}
              className="border-2 border-cloud-gold bg-transparent px-4 py-2 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-cloud-gold transition-colors hover:bg-cloud-gold hover:text-sky-top"
            >
              {fase === "fim" ? t(arcade.denovo) : t(arcade.jogar)}
            </button>
          </div>
        ) : null}
      </div>

      {fase === "jogando" && !temHover ? (
        <div className="grid grid-cols-4 gap-2">
          <button type="button" aria-label={t(arcade.corrida.esquerda)} className={botaoToque} {...segurar("esq")}>
            ←
          </button>
          <button type="button" aria-label={t(arcade.corrida.direita)} className={botaoToque} {...segurar("dir")}>
            →
          </button>
          <button type="button" className={botaoToque} {...segurar("freio")}>
            {t(arcade.corrida.frear)}
          </button>
          <button type="button" className={botaoToque} {...segurar("gas")}>
            {t(arcade.corrida.acelerar)}
          </button>
        </div>
      ) : null}

      <p className="pixel-body m-0 text-right text-cloud-rose">
        {t(arcade.corrida.melhorVolta)}: {relogio(recorde)}
      </p>
    </div>
  );
}
