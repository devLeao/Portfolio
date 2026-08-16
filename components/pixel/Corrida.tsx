"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useSound } from "@/components/providers/SoundProvider";
import { arcade } from "@/content/content";

/**
 * Corrida de desvio: três faixas, pista acelerando, três vidas.
 *
 * A dificuldade e a sensação de velocidade são a MESMA variável. Uma coisa só
 * governa as duas, então o jogo nunca fica difícil sem parecer mais rápido —
 * e é isso que faz perder parecer justo.
 *
 * As três vidas mudam o jogo mais do que parece: com uma só, bater aos 40
 * pontos apaga tudo e a pessoa desiste. Com três, o erro vira susto e ela
 * continua. Depois de bater há invulnerabilidade curta e o carro pisca — sem
 * isso, dá para bater três vezes no mesmo carro em meio segundo.
 *
 * O som do motor é contínuo e acompanha a velocidade (ver SoundProvider): é
 * ele que faz o jogo soar a corrida em vez de a planilha com carrinhos.
 */

const FAIXAS = 3;
const ALTURA = 320;
const LARGURA = 230;
const VIDAS_INICIAIS = 3;

type Inimigo = { faixa: number; y: number; cor: string; tipo: 0 | 1 };
type Cenario = { y: number; lado: -1 | 1; tipo: 0 | 1 };
/**
 * Carro que acabou de ser atingido: sai de lado girando.
 *
 * Sem isto, o inimigo simplesmente sumia no impacto e a batida não tinha
 * consequência visível — só o número de vidas caía. O giro dura pouco mais
 * de um segundo e é o que faz a colisão parecer colisão.
 */
type Destroco = {
  x: number;
  y: number;
  cor: string;
  giro: number;
  vGiro: number;
  vx: number;
  vy: number;
  vida: number;
};

const CORES_INIMIGO = ["#F472B6", "#FBBF24", "#60A5FA", "#A78BFA"];

export default function Corrida() {
  const { t } = useLocale();
  const { tocar, motorLigar, motorAjustar, motorDesligar, musicaLigar, musicaDesligar } =
    useSound();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [rodando, setRodando] = useState(false);
  const [perdeu, setPerdeu] = useState(false);
  const [pontos, setPontos] = useState(0);
  const [recorde, setRecorde] = useState(0);
  const [vidas, setVidas] = useState(VIDAS_INICIAIS);

  const faixaAlvo = useRef(1);
  const faixaAtual = useRef(1);
  const inimigos = useRef<Inimigo[]>([]);
  const cenario = useRef<Cenario[]>([]);
  const destrocos = useRef<Destroco[]>([]);
  const velocidade = useRef(2.4);
  const distancia = useRef(0);
  const proximo = useRef(0);
  const proximoCenario = useRef(0);
  const listras = useRef(0);
  const invulnAte = useRef(0);
  const vidasRef = useRef(VIDAS_INICIAIS);
  const quadro = useRef(0);
  const raf = useRef(0);

  const xDaFaixa = (f: number) => (LARGURA / FAIXAS) * (f + 0.5);

  /* ============================================================
     DESENHO
     ============================================================ */
  const desenhar = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.imageSmoothingEnabled = false;

    // ---------- pista ----------
    const asfalto = ctx.createLinearGradient(0, 0, 0, ALTURA);
    asfalto.addColorStop(0, "#150925");
    asfalto.addColorStop(1, "#231038");
    ctx.fillStyle = asfalto;
    ctx.fillRect(0, 0, LARGURA, ALTURA);

    // acostamento com zebrado correndo — junto com as listras do meio, é o
    // que dá velocidade mesmo com o carro parado no centro
    for (let y = -30; y < ALTURA; y += 30) {
      const yy = y + (listras.current % 30);
      ctx.fillStyle = Math.floor((yy + listras.current) / 30) % 2 === 0 ? "#F472B6" : "#F5F1EA";
      ctx.fillRect(0, yy, 7, 15);
      ctx.fillRect(LARGURA - 7, yy, 7, 15);
    }

    // ---------- cenário de beira de pista ----------
    for (const c of cenario.current) {
      const x = c.lado === -1 ? 12 : LARGURA - 26;
      if (c.tipo === 0) {
        // poste de luz
        ctx.fillStyle = "#3B2565";
        ctx.fillRect(x + 5, c.y, 3, 26);
        ctx.fillStyle = "#FBBF24";
        ctx.fillRect(x + 1, c.y - 4, 11, 5);
      } else {
        // arbusto pixel
        ctx.fillStyle = "#2F6B4A";
        ctx.fillRect(x, c.y + 6, 14, 10);
        ctx.fillRect(x + 3, c.y, 8, 8);
      }
    }

    // ---------- divisórias ----------
    ctx.fillStyle = "#7C5AC7";
    for (let f = 1; f < FAIXAS; f += 1) {
      const x = (LARGURA / FAIXAS) * f - 2;
      for (let y = -44; y < ALTURA; y += 44) {
        ctx.fillRect(x, y + (listras.current % 44), 4, 22);
      }
    }

    /**
     * Carro com janelas, rodas e faróis. A versão anterior era um retângulo
     * com um risco — daqui vem quase toda a diferença de leitura.
     */
    const carro = (x: number, y: number, cor: string, meu: boolean, tipo = 0, giro = 0) => {
      // Girar exige transformar o contexto: desenhar quadrado por quadrado
      // rotacionado seria trigonometria em vinte retângulos.
      const rodado = giro !== 0;
      if (rodado) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(giro);
        ctx.translate(-x, -y);
      }
      const L = 32;
      const A = 50;
      const ex = x - L / 2;
      const ey = y - A / 2;

      // rodas primeiro, para ficarem por baixo
      ctx.fillStyle = "#100A18";
      ctx.fillRect(ex - 3, ey + 8, 4, 12);
      ctx.fillRect(ex + L - 1, ey + 8, 4, 12);
      ctx.fillRect(ex - 3, ey + A - 20, 4, 12);
      ctx.fillRect(ex + L - 1, ey + A - 20, 4, 12);

      // lataria
      ctx.fillStyle = cor;
      ctx.fillRect(ex, ey + 3, L, A - 6);
      ctx.fillRect(ex + 3, ey, L - 6, A);

      // vidro
      ctx.fillStyle = "#0E1524";
      const vy = meu ? ey + 9 : ey + A - 22;
      ctx.fillRect(ex + 5, vy, L - 10, 13);

      // capô / teto
      ctx.fillStyle = "rgba(255,255,255,0.14)";
      ctx.fillRect(ex + 6, meu ? ey + 26 : ey + 10, L - 12, 9);

      // faróis ou lanternas
      if (meu) {
        ctx.fillStyle = "#FFF7D6";
        ctx.fillRect(ex + 3, ey + 1, 6, 4);
        ctx.fillRect(ex + L - 9, ey + 1, 6, 4);
      } else {
        ctx.fillStyle = "#FF6B6B";
        ctx.fillRect(ex + 3, ey + A - 5, 6, 4);
        ctx.fillRect(ex + L - 9, ey + A - 5, 6, 4);
      }

      // faixa central nos inimigos, para não parecerem clones
      if (!meu && tipo === 1) {
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(x - 2, ey + 4, 4, A - 8);
      }

      if (rodado) ctx.restore();
    };

    for (const d of destrocos.current) {
      ctx.globalAlpha = Math.max(0, Math.min(1, d.vida / 40));
      carro(d.x, d.y, d.cor, false, 0, d.giro);
      ctx.globalAlpha = 1;
    }

    for (const i of inimigos.current) carro(xDaFaixa(i.faixa), i.y, i.cor, false, i.tipo);

    // O meu carro pisca durante a invulnerabilidade.
    const piscando = quadro.current < invulnAte.current && Math.floor(quadro.current / 4) % 2 === 0;
    if (!piscando) {
      const meuX = xDaFaixa(faixaAtual.current);
      carro(meuX, ALTURA - 52, "#4ADE80", true);

      // rastro de escape quando está rápido
      if (velocidade.current > 4) {
        ctx.fillStyle = "rgba(74,222,128,0.25)";
        ctx.fillRect(meuX - 9, ALTURA - 22, 5, 10);
        ctx.fillRect(meuX + 4, ALTURA - 22, 5, 10);
      }
    }
  }, []);

  useEffect(() => {
    desenhar();
  }, [desenhar]);

  /* ============================================================
     LAÇO
     ============================================================ */
  useEffect(() => {
    if (!rodando) return;

    motorLigar();
    musicaLigar();

    const passo = () => {
      quadro.current += 1;
      const v = velocidade.current;
      listras.current += v;
      distancia.current += v;

      velocidade.current = Math.min(7.5, 2.4 + distancia.current / 850);
      // O motor acompanha a pista. É a mesma variável de novo.
      motorAjustar((velocidade.current - 2.4) / 5.1);

      faixaAtual.current += (faixaAlvo.current - faixaAtual.current) * 0.25;

      // ---------- surgimento ----------
      proximo.current -= v;
      if (proximo.current <= 0) {
        inimigos.current.push({
          faixa: Math.floor(Math.random() * FAIXAS),
          y: -56,
          cor: CORES_INIMIGO[Math.floor(Math.random() * CORES_INIMIGO.length)] ?? "#F472B6",
          tipo: Math.random() > 0.5 ? 1 : 0,
        });
        proximo.current = 125 + Math.random() * 105;
      }

      proximoCenario.current -= v;
      if (proximoCenario.current <= 0) {
        cenario.current.push({
          y: -30,
          lado: Math.random() > 0.5 ? 1 : -1,
          tipo: Math.random() > 0.5 ? 1 : 0,
        });
        proximoCenario.current = 55 + Math.random() * 40;
      }

      cenario.current = cenario.current.filter((c) => {
        c.y += v;
        return c.y < ALTURA + 40;
      });

      // Destroços: giram, deslizam para fora e desaparecem.
      destrocos.current = destrocos.current.filter((d) => {
        d.giro += d.vGiro;
        d.x += d.vx;
        d.y += d.vy + v;
        d.vx *= 0.97;
        d.vida -= 1;
        return d.vida > 0 && d.y < ALTURA + 80;
      });

      // ---------- movimento e colisão ----------
      const meuX = xDaFaixa(faixaAtual.current);
      const meuY = ALTURA - 52;
      let bateu = false;

      inimigos.current = inimigos.current.filter((i) => {
        i.y += v;

        if (quadro.current >= invulnAte.current) {
          const dx = Math.abs(xDaFaixa(i.faixa) - meuX);
          const dy = Math.abs(i.y - meuY);
          if (dx < 28 && dy < 46) {
            bateu = true;
            /*
             * O carro batido sai da lista de inimigos e vira DESTROÇO: ele
             * some da colisão (senão encostaria de novo no quadro seguinte e
             * comeria duas vidas), mas continua na tela girando e escapando
             * para o lado do impacto. É o que dá consequência à batida.
             */
            const lado = Math.sign(xDaFaixa(i.faixa) - meuX) || 1;
            destrocos.current.push({
              x: xDaFaixa(i.faixa),
              y: i.y,
              cor: i.cor,
              giro: 0,
              vGiro: lado * (0.16 + Math.random() * 0.1),
              vx: lado * (2.4 + Math.random() * 1.6),
              vy: -1.6 - Math.random(),
              vida: 46,
            });
            return false;
          }
        }

        if (i.y > ALTURA + 60) {
          setPontos((p) => p + 1);
          return false;
        }
        return true;
      });

      if (bateu) {
        tocar("batida");
        vidasRef.current -= 1;
        setVidas(vidasRef.current);
        invulnAte.current = quadro.current + 90;

        if (vidasRef.current <= 0) {
          setRodando(false);
          setPerdeu(true);
          motorDesligar();
          musicaDesligar();
          tocar("derrota");
          setPontos((p) => {
            setRecorde((r) => Math.max(r, p));
            return p;
          });
          desenhar();
          return;
        }
      }

      desenhar();
      raf.current = requestAnimationFrame(passo);
    };

    raf.current = requestAnimationFrame(passo);
    return () => {
      cancelAnimationFrame(raf.current);
      motorDesligar();
      musicaDesligar();
    };
  }, [rodando, desenhar, tocar, motorLigar, motorAjustar, motorDesligar, musicaLigar, musicaDesligar]);

  const mover = useCallback(
    (delta: number) => {
      const nova = Math.max(0, Math.min(FAIXAS - 1, faixaAlvo.current + delta));
      if (nova === faixaAlvo.current) return;
      faixaAlvo.current = nova;
      tocar("virar");
    },
    [tocar]
  );

  useEffect(() => {
    if (!rodando) return;
    const aoTeclar = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "arrowleft" || k === "a") {
        e.preventDefault();
        mover(-1);
      } else if (k === "arrowright" || k === "d") {
        e.preventDefault();
        mover(1);
      }
    };
    window.addEventListener("keydown", aoTeclar, { passive: false });
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [rodando, mover]);

  const comecar = () => {
    faixaAlvo.current = 1;
    faixaAtual.current = 1;
    inimigos.current = [];
    cenario.current = [];
    destrocos.current = [];
    velocidade.current = 2.4;
    distancia.current = 0;
    proximo.current = 0;
    proximoCenario.current = 0;
    invulnAte.current = 0;
    quadro.current = 0;
    vidasRef.current = VIDAS_INICIAIS;
    setVidas(VIDAS_INICIAIS);
    setPontos(0);
    setPerdeu(false);
    setRodando(true);
    tocar("motor");
  };

  return (
    <div className="flex flex-col gap-3">
      {/* vidas */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5" aria-label={`${vidas} ${t(arcade.corrida.vidas)}`}>
          {Array.from({ length: VIDAS_INICIAIS }, (_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={`block size-3 ${i < vidas ? "bg-neon" : "bg-bone/15"}`}
            />
          ))}
        </div>
        <span className="pixel-body text-cloud-rose">
          {t(arcade.corrida.desviados)}: {pontos}
        </span>
      </div>

      <div className="relative mx-auto w-full max-w-[280px]">
        <canvas
          ref={canvasRef}
          width={LARGURA}
          height={ALTURA}
          className="pixelated w-full touch-none border-2 border-cozy-blue/60 bg-sky-top"
          onPointerDown={(e) => {
            if (!rodando) return;
            const r = e.currentTarget.getBoundingClientRect();
            mover(e.clientX - r.left < r.width / 2 ? -1 : 1);
          }}
        />

        {!rodando ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-sky-top/90 p-4 text-center">
            <p className="pixel-title m-0 text-[0.625rem] leading-relaxed text-cozy-blue">
              {perdeu ? `${t(arcade.corrida.fim)} ${pontos}` : t(arcade.corrida.nome)}
            </p>
            <p className="pixel-body m-0 max-w-[26ch] text-cloud-rose">
              {t(arcade.corrida.como)}
            </p>
            <button
              type="button"
              onClick={comecar}
              className="border-2 border-cozy-blue bg-transparent px-4 py-2 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-cozy-blue transition-colors hover:bg-cozy-blue hover:text-sky-top"
            >
              {perdeu ? t(arcade.denovo) : t(arcade.jogar)}
            </button>
          </div>
        ) : null}
      </div>

      <p className="pixel-body m-0 text-right text-cloud-rose">
        {t(arcade.recorde)}: {recorde}
      </p>
    </div>
  );
}
