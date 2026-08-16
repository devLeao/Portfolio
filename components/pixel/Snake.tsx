"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useSound } from "@/components/providers/SoundProvider";
import { arcade } from "@/content/content";

/**
 * Snake, em canvas, com estética pixel.
 *
 * Canvas e não DOM: uma grade de 18×18 seriam 324 nós sendo repintados várias
 * vezes por segundo. Aqui é um `fillRect` por célula viva.
 *
 * O jogo anda em passos de tempo fixo, não por quadro. Amarrado ao
 * `requestAnimationFrame`, a cobra andaria mais rápido num monitor de 144Hz
 * do que num de 60 — o mesmo jogo ficaria com duas dificuldades diferentes
 * dependendo do aparelho.
 *
 * Controles: setas, WASD, ou arrastar o dedo na tela.
 */

const GRADE = 18;
/* 220ms e não 190: a cobra nasce andando, e quem acabou de apertar "jogar"
   precisa de um instante para achar as setas antes da primeira curva. */
const PASSO_INICIAL = 220;

type Ponto = { x: number; y: number };
type Dir = "cima" | "baixo" | "esq" | "dir";

const DELTA: Record<Dir, Ponto> = {
  cima: { x: 0, y: -1 },
  baixo: { x: 0, y: 1 },
  esq: { x: -1, y: 0 },
  dir: { x: 1, y: 0 },
};

const OPOSTA: Record<Dir, Dir> = {
  cima: "baixo",
  baixo: "cima",
  esq: "dir",
  dir: "esq",
};

export default function Snake() {
  const { t } = useLocale();
  const { tocar } = useSound();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rodando, setRodando] = useState(false);
  const [pontos, setPontos] = useState(0);
  const [recorde, setRecorde] = useState(0);
  const [perdeu, setPerdeu] = useState(false);

  const cobra = useRef<Ponto[]>([{ x: 3, y: 9 }]);
  const dir = useRef<Dir>("dir");
  /* Fila de direções: apertar duas setas entre dois passos perdia a primeira,
     e a cobra ignorava o comando. Com fila, todo toque conta. */
  const fila = useRef<Dir[]>([]);
  const fruta = useRef<Ponto>({ x: 12, y: 9 });
  const passo = useRef(PASSO_INICIAL);

  const sortearFruta = useCallback(() => {
    let p: Ponto;
    do {
      p = {
        x: Math.floor(Math.random() * GRADE),
        y: Math.floor(Math.random() * GRADE),
      };
    } while (cobra.current.some((c) => c.x === p.x && c.y === p.y));
    fruta.current = p;
  }, []);

  const desenhar = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const lado = canvas.width / GRADE;
    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = "#1A0B2E";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // grade sutil, para o campo não ser um vazio roxo
    ctx.strokeStyle = "rgba(139,92,246,0.13)";
    ctx.lineWidth = 1;
    for (let i = 1; i < GRADE; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * lado, 0);
      ctx.lineTo(i * lado, canvas.height);
      ctx.moveTo(0, i * lado);
      ctx.lineTo(canvas.width, i * lado);
      ctx.stroke();
    }

    ctx.fillStyle = "#F472B6";
    ctx.fillRect(fruta.current.x * lado + 2, fruta.current.y * lado + 2, lado - 4, lado - 4);

    cobra.current.forEach((c, i) => {
      // Cabeça mais clara: sem isso não dá para saber para onde ela vai.
      ctx.fillStyle = i === 0 ? "#86EFAC" : "#4ADE80";
      ctx.fillRect(c.x * lado + 1, c.y * lado + 1, lado - 2, lado - 2);
    });
  }, []);

  const reiniciar = useCallback(() => {
    cobra.current = [{ x: 3, y: 9 }];
    dir.current = "dir";
    fila.current = [];
    passo.current = PASSO_INICIAL;
    setPontos(0);
    setPerdeu(false);
    sortearFruta();
    setRodando(true);
  }, [sortearFruta]);

  /** Um passo do jogo. */
  const avancar = useCallback(() => {
    const proxima = fila.current.shift();
    if (proxima && proxima !== OPOSTA[dir.current]) dir.current = proxima;

    const d = DELTA[dir.current];
    const cabeca = cobra.current[0];
    if (!cabeca) return;

    const nova = { x: cabeca.x + d.x, y: cabeca.y + d.y };

    const bateu =
      nova.x < 0 ||
      nova.y < 0 ||
      nova.x >= GRADE ||
      nova.y >= GRADE ||
      cobra.current.some((c) => c.x === nova.x && c.y === nova.y);

    if (bateu) {
      setRodando(false);
      setPerdeu(true);
      tocar("derrota");
      setRecorde((r) => Math.max(r, cobra.current.length - 1));
      return;
    }

    cobra.current.unshift(nova);

    if (nova.x === fruta.current.x && nova.y === fruta.current.y) {
      setPontos((p) => p + 1);
      tocar("comer");
      // Acelera até um piso: sem teto, em 15 frutas vira ingovernável.
      passo.current = Math.max(80, passo.current - 6);
      sortearFruta();
    } else {
      cobra.current.pop();
    }

    desenhar();
  }, [desenhar, sortearFruta, tocar]);

  /** Relógio do jogo, com passo de tempo fixo. */
  useEffect(() => {
    if (!rodando) return;
    let id: number;
    const tick = () => {
      avancar();
      id = window.setTimeout(tick, passo.current);
    };
    id = window.setTimeout(tick, passo.current);
    return () => window.clearTimeout(id);
  }, [rodando, avancar]);

  useEffect(() => {
    desenhar();
  }, [desenhar]);

  /** Teclado. Só sequestra as setas ENQUANTO o jogo roda. */
  useEffect(() => {
    if (!rodando) return;

    const mapa: Record<string, Dir> = {
      ArrowUp: "cima",
      ArrowDown: "baixo",
      ArrowLeft: "esq",
      ArrowRight: "dir",
      w: "cima",
      s: "baixo",
      a: "esq",
      d: "dir",
    };

    const aoTeclar = (e: KeyboardEvent) => {
      const nova = mapa[e.key] ?? mapa[e.key.toLowerCase()];
      if (!nova) return;
      // Enquanto joga, seta não rola a página. Fora do jogo, rola normal.
      e.preventDefault();
      if (fila.current.length < 3) fila.current.push(nova);
    };

    window.addEventListener("keydown", aoTeclar, { passive: false });
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [rodando]);

  /** Arrastar o dedo: sem isto o jogo não existe no celular. */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let origem: { x: number; y: number } | null = null;

    const comecar = (e: PointerEvent) => {
      origem = { x: e.clientX, y: e.clientY };
    };
    const terminar = (e: PointerEvent) => {
      if (!origem) return;
      const dx = e.clientX - origem.x;
      const dy = e.clientY - origem.y;
      origem = null;
      if (Math.hypot(dx, dy) < 24) return;
      const nova: Dir =
        Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "dir" : "esq") : dy > 0 ? "baixo" : "cima";
      if (fila.current.length < 3) fila.current.push(nova);
    };

    canvas.addEventListener("pointerdown", comecar);
    canvas.addEventListener("pointerup", terminar);
    return () => {
      canvas.removeEventListener("pointerdown", comecar);
      canvas.removeEventListener("pointerup", terminar);
    };
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={360}
          height={360}
          className="pixelated aspect-square w-full touch-none rounded-none border-2 border-neon/60 bg-sky-top"
        />

        {!rodando ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-sky-top/85 p-4 text-center">
            <p className="pixel-title m-0 text-[0.6875rem] leading-relaxed text-neon">
              {perdeu ? `${t(arcade.snake.fim)} ${pontos}` : t(arcade.snake.nome)}
            </p>
            <p className="pixel-body m-0 text-cloud-rose">{t(arcade.snake.como)}</p>
            <button
              type="button"
              onClick={reiniciar}
              className="border-2 border-neon bg-transparent px-4 py-2 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-neon transition-colors hover:bg-neon hover:text-sky-top"
            >
              {perdeu ? t(arcade.denovo) : t(arcade.jogar)}
            </button>
          </div>
        ) : null}
      </div>

      <p className="pixel-body m-0 flex justify-between text-cloud-rose">
        <span>
          {t(arcade.pontos)}: {pontos}
        </span>
        <span>
          {t(arcade.recorde)}: {recorde}
        </span>
      </p>
    </div>
  );
}
