"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useSound } from "@/components/providers/SoundProvider";
import { arcade } from "@/content/content";

/**
 * Luta de rua — canvas, pixel, e um boneco que reage a apanhar.
 *
 *   ← →  andar        J  soco   (rápido, alcance curto)
 *   S    defesa       K  chute  (lento, derruba)
 *
 * ---------- o que faz a luta parecer luta ----------
 * Não é o dano: é a REAÇÃO. Golpe que só desconta número de barra some no
 * meio do jogo. Aqui cada acerto produz, na ordem: flash branco no corpo,
 * faíscas no ponto de contato, cuspe voando da boca, o tronco jogado para
 * trás, e a tela tremendo. Chute derruba — o lutador cai deitado e demora a
 * levantar.
 *
 * ---------- o cenário ----------
 * Quatro camadas: céu em gradiente, silhueta de prédios com janelas que
 * piscam, letreiro de neon pulsando, e a plateia balançando na frente do
 * ringue. Fundo chapado deixaria os dois bonecos boiando no vazio.
 *
 * Tudo desenhado com retângulos. Nenhum asset, nenhuma engine.
 */

const LARGURA = 520;
const ALTURA = 290;
const CHAO = ALTURA - 54;
/* 120: 100 acabava rápido demais e 150 arrastava. Aqui a partida dura o
   suficiente para aprender a distância sem virar maratona. */
const VIDA_MAX = 120;
const LIMITE = { min: 46, max: LARGURA - 46 };

type Acao =
  | "parado"
  | "andando"
  | "soco"
  | "chute"
  | "defesa"
  | "atordoado"
  | "caido"
  /** No chão, empurrando para levantar. Já é recuperação, não punição. */
  | "levantando"
  | "comemorando";

/**
 * Em que ponto a partida está.
 *
 * A comemoração é uma FASE, não um estado de lutador: durante ela ninguém
 * apanha, o vencedor pula com os braços erguidos, o perdedor fica no chão, e
 * o K.O. cresce no meio da tela. Só depois disso o painel de fim aparece.
 * Cortar direto para "você venceu" joga fora o melhor momento da luta.
 */
type Fase = "pronto" | "lutando" | "pausado" | "comemorando" | "fim";

type Lutador = {
  x: number;
  vida: number;
  acao: Acao;
  timer: number;
  acertou: boolean;
  dir: 1 | -1;
  /** Inclinação do tronco ao apanhar. Volta ao prumo sozinha. */
  cambaleio: number;
  /** Quadros restantes de flash branco. */
  flash: number;
  /** Enquanto > 0, não pode ser atingido. Cai a cada quadro. */
  intocavel: number;
};

type Particula = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  vida: number;
  cor: string;
  tam: number;
};

const GOLPES = {
  soco: { dur: 16, impacto: 5, alcance: 50, dano: 6, recuo: 6 },
  chute: { dur: 30, impacto: 11, alcance: 66, dano: 14, recuo: 18 },
} as const;

const DUR_DEFESA = 8;
const DUR_ATORDOADO = 26;
/* Queda curta: 78 quadros no chão parava o combate por mais de um segundo e
   meio, e a luta perdia o ritmo. 24 no chão + 20 levantando dá o peso da
   queda sem transformar em espera. */
const DUR_CAIDO = 24;
const DUR_LEVANTANDO = 20;
/**
 * Quadros em que o lutador NÃO pode ser atingido.
 *
 * Cobre a queda inteira, o levantar, e mais um respiro. Sem isto dá para
 * socar quem caiu até a barra zerar e ele nunca levanta — o jogo vira
 * execução em vez de luta.
 */
const INVULNERAVEL = DUR_CAIDO + DUR_LEVANTANDO + 14;
/** Quadros de comemoração antes do painel de fim aparecer. */
const DUR_COMEMORACAO = 165;
const VELOCIDADE = 2.6;

function novo(x: number, dir: 1 | -1): Lutador {
  return {
    x,
    vida: VIDA_MAX,
    acao: "parado",
    timer: 0,
    acertou: false,
    dir,
    cambaleio: 0,
    flash: 0,
    intocavel: 0,
  };
}

export default function Luta() {
  const { t } = useLocale();
  const { tocar, torcidaLigar, torcidaDesligar, torcidaVibrar } = useSound();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [fase, setFase] = useState<Fase>("pronto");
  const [fim, setFim] = useState<"ganhou" | "perdeu" | null>(null);
  const [vidas, setVidas] = useState({ eu: VIDA_MAX, ele: VIDA_MAX });

  /* O laço lê a fase por ref: dentro do `requestAnimationFrame` o valor de
     estado ficaria congelado no fechamento do primeiro quadro. */
  const faseRef = useRef<Fase>("pronto");
  const vencedor = useRef<"eu" | "ele" | null>(null);
  const comemoraAte = useRef(0);
  const rodando = fase === "lutando";

  const eu = useRef<Lutador>(novo(160, 1));
  const ele = useRef<Lutador>(novo(360, -1));
  const teclas = useRef<Set<string>>(new Set());
  const particulas = useRef<Particula[]>([]);
  const tremor = useRef(0);
  const iaProximo = useRef(60);
  const quadro = useRef(0);
  const raf = useRef(0);

  /** Faíscas, cuspe e suor saindo de um ponto de impacto. */
  const soltar = useCallback((x: number, y: number, dir: 1 | -1, forte: boolean) => {
    const n = forte ? 14 : 8;
    for (let i = 0; i < n; i += 1) {
      const cuspe = i % 3 === 0;
      particulas.current.push({
        x,
        y: y + (Math.random() - 0.5) * 10,
        vx: dir * (1.2 + Math.random() * (forte ? 4 : 2.4)),
        vy: -1.6 - Math.random() * (forte ? 3 : 2),
        vida: 18 + Math.random() * (forte ? 22 : 12),
        // Cuspe é claro e maior; faísca do impacto é dourada e pequena.
        cor: cuspe ? "#F5F1EA" : forte ? "#FBBF24" : "#F9A8D4",
        tam: cuspe ? 3 : 2,
      });
    }
  }, []);

  /* ============================================================
     DESENHO
     ============================================================ */
  const desenhar = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.save();

    if (tremor.current > 0) {
      ctx.translate(
        (Math.random() - 0.5) * tremor.current,
        (Math.random() - 0.5) * tremor.current
      );
    }

    // ---------- 1. céu ----------
    const ceu = ctx.createLinearGradient(0, 0, 0, CHAO);
    ceu.addColorStop(0, "#0E0620");
    ceu.addColorStop(0.55, "#2A1348");
    ceu.addColorStop(1, "#5B2A5E");
    ctx.fillStyle = ceu;
    ctx.fillRect(-20, -20, LARGURA + 40, ALTURA + 40);

    ctx.fillStyle = "#FBE38A";
    ctx.fillRect(LARGURA - 78, 22, 22, 22);
    ctx.fillStyle = "rgba(251,227,138,0.12)";
    ctx.fillRect(LARGURA - 86, 14, 38, 38);

    // ---------- 2. prédios ----------
    for (let i = 0; i < 9; i += 1) {
      const l = 40 + ((i * 41) % 30);
      const a = 58 + ((i * 67) % 74);
      const x = i * 60 - 10;
      ctx.fillStyle = i % 2 === 0 ? "#180C2C" : "#1E1038";
      ctx.fillRect(x, CHAO - a, l, a);

      for (let j = 0; j < 4; j += 1) {
        for (let k = 0; k < 2; k += 1) {
          const acesa = (i + j + k) % 3 !== 0;
          const pisca = (i + j) % 5 === 0 && Math.floor(quadro.current / 40) % 2 === 0;
          if (!acesa || pisca) continue;
          ctx.fillStyle = (i + j) % 4 === 0 ? "#F9A8D4" : "#5B3E8F";
          ctx.fillRect(x + 7 + k * 14, CHAO - a + 12 + j * 16, 6, 8);
        }
      }
    }

    // ---------- 3. letreiro de neon ----------
    const brilho = 0.55 + Math.sin(quadro.current * 0.06) * 0.25;
    ctx.fillStyle = `rgba(244,114,182,${brilho})`;
    ctx.fillRect(38, 40, 74, 5);
    ctx.fillRect(38, 52, 52, 5);
    ctx.fillStyle = `rgba(244,114,182,${brilho * 0.18})`;
    ctx.fillRect(30, 32, 90, 34);

    // ---------- 4. ringue e plateia ----------
    const piso = ctx.createLinearGradient(0, CHAO, 0, ALTURA);
    piso.addColorStop(0, "#3A2260");
    piso.addColorStop(1, "#1D1033");
    ctx.fillStyle = piso;
    ctx.fillRect(-20, CHAO, LARGURA + 40, ALTURA - CHAO + 20);
    ctx.fillStyle = "#6B47A8";
    ctx.fillRect(-20, CHAO, LARGURA + 40, 3);

    /*
     * Plateia em duas fileiras, com alturas e cores variadas, e alguns
     * levantando o braço fora de compasso.
     *
     * A versão anterior era dezesseis retângulos idênticos balançando juntos
     * — lia como serrilha, não como gente. O que quebra o padrão é a
     * VARIAÇÃO: cada pessoa tem altura, cor e fase de balanço próprias, e
     * quem levanta o braço é escolhido por resto de divisão, nunca todo mundo.
     */
    const TONS = ["#0C0716", "#140A22", "#1A0E2C", "#0F0819"];
    const PELES = ["#4A2F26", "#6B4636", "#8A5B44", "#3A241C"];

    for (const fila of [0, 1]) {
      const base = ALTURA - (fila === 0 ? 6 : 20);
      const passoX = fila === 0 ? 30 : 34;
      const desloca = fila === 0 ? 0 : 15;

      for (let i = 0; i < 19; i += 1) {
        const x = i * passoX - 10 + desloca;
        const fase = i * 1.7 + fila * 2.2;
        const bob = Math.sin(quadro.current * 0.055 + fase) * 2.8;
        const altura = 22 + ((i * 7 + fila * 3) % 9);
        const largura = 17 + ((i * 5) % 5);

        // corpo
        ctx.fillStyle = TONS[(i + fila) % TONS.length] ?? "#0C0716";
        ctx.fillRect(x, base - altura + bob, largura, altura + 12);
        // cabeça
        ctx.fillStyle = PELES[(i * 3 + fila) % PELES.length] ?? "#4A2F26";
        ctx.fillRect(x + largura / 2 - 5, base - altura - 9 + bob, 10, 10);

        // braço levantado: um a cada três, em compasso próprio
        if ((i + fila) % 3 === 0) {
          const alto = Math.sin(quadro.current * 0.09 + fase) > 0.1;
          ctx.fillStyle = PELES[(i * 3 + fila) % PELES.length] ?? "#4A2F26";
          ctx.fillRect(
            x + (i % 2 === 0 ? -3 : largura),
            base - altura + bob - (alto ? 13 : 2),
            4,
            alto ? 16 : 12
          );
        }
      }
    }

    /* ============================================================
       BONECO
       ============================================================ */
    const boneco = (
      l: Lutador,
      pele: string,
      peleEscura: string,
      calcao: string,
      luva: string,
      cabelo: string
    ) => {
      const p = 5;
      const d = l.dir;
      const caido = l.acao === "caido";
      const levantando = l.acao === "levantando";
      const festejando = l.acao === "comemorando";
      // Ao levantar, o corpo sai da horizontal e volta ao prumo — é a
      // interpolação que faz parecer que ele se apoia e sobe.
      const kLevanta = levantando ? 1 - l.timer / DUR_LEVANTANDO : 0;

      // Piscar enquanto está intocável — o sinal universal de "não vale
      // bater agora". Sem ele a regra existe mas ninguém percebe.
      const piscando =
        l.intocavel > 0 && l.acao !== "caido" && Math.floor(quadro.current / 4) % 2 === 0;
      if (piscando) return;

      ctx.save();
      ctx.translate(l.x, CHAO);
      // Caído deita o corpo; levantando desfaz a deitada; cambaleio inclina.
      ctx.rotate(caido ? d * -1.35 : levantando ? d * -1.35 * (1 - kLevanta) : l.cambaleio);
      if (caido) ctx.translate(d * 12, 4);
      else if (levantando) ctx.translate(d * 12 * (1 - kLevanta), 4 * (1 - kLevanta));
      // Pulinho de comemoração.
      if (festejando) ctx.translate(0, -Math.abs(Math.sin(quadro.current * 0.16)) * 14);

      // Respiração no ocioso: o boneco nunca fica completamente parado.
      const respiro =
        l.acao === "parado" || festejando ? Math.sin(quadro.current * 0.09) * 1.2 : 0;
      const passo = l.acao === "andando" ? Math.sin(quadro.current * 0.28) * p * 0.9 : 0;

      const golpeando = l.acao === "soco" || l.acao === "chute";
      const g = golpeando ? GOLPES[l.acao as "soco" | "chute"] : null;
      const fase = g ? Math.sin(((g.dur - l.timer) / g.dur) * Math.PI) : 0;

      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(-p * 3.4, -2, p * 6.8, 4);

      // ---------- pernas ----------
      ctx.fillStyle = "#15101F";
      ctx.fillRect(-p * 2.1 - passo, -p * 1.4, p * 1.9, p * 1.4);
      ctx.fillRect(p * 0.3 + passo, -p * 1.4, p * 1.9, p * 1.4);

      ctx.fillStyle = peleEscura;
      ctx.fillRect(-p * 2 - passo, -p * 4.2, p * 1.7, p * 3);
      if (l.acao === "chute") {
        ctx.fillRect(
          d === 1 ? p * 0.4 : -p * 2 - fase * p * 6,
          -p * 5.6,
          p * 1.7 + fase * p * 6,
          p * 1.6
        );
      } else {
        ctx.fillRect(p * 0.4 + passo, -p * 4.2, p * 1.7, p * 3);
      }

      ctx.fillStyle = calcao;
      ctx.fillRect(-p * 2.3, -p * 6, p * 4.6, p * 2);

      // ---------- tronco ----------
      const alturaTronco = l.acao === "defesa" ? p * 4.2 : p * 4.8;
      const topo = -p * 6 - alturaTronco + respiro;

      ctx.fillStyle = pele;
      ctx.fillRect(-p * 2.3, topo, p * 4.6, alturaTronco);
      // Sombra do lado oposto à luz — é o que tira o boneco do chapado.
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.fillRect(d === 1 ? -p * 2.3 : p * 1.1, topo, p * 1.2, alturaTronco);
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(-p * 1.6, topo + p * 0.6, p * 3.2, p * 1.4);

      // ---------- cabeça ----------
      const cy = topo - p * 3.2;
      ctx.fillStyle = pele;
      ctx.fillRect(-p * 1.6, cy, p * 3.2, p * 3.2);
      ctx.fillStyle = cabelo;
      ctx.fillRect(-p * 1.7, cy - p * 0.5, p * 3.4, p * 1.2);

      ctx.fillStyle = "#0C0714";
      if (l.acao === "atordoado" || caido || levantando) {
        // olho em X
        ctx.fillRect(d * p * 0.4 - p * 0.5, cy + p * 1, p * 1, p * 0.4);
        ctx.fillRect(d * p * 0.4 - p * 0.1, cy + p * 0.7, p * 0.3, p * 1);
      } else {
        ctx.fillRect(d * p * 0.6 - p * 0.3, cy + p * 1, p * 0.7, p * 0.7);
      }
      // A boca abre no quadro do impacto — é por onde o cuspe sai.
      ctx.fillRect(
        d * p * 0.2 - p * 0.5,
        cy + p * 2.2,
        p * (l.flash > 0 ? 1.4 : 1),
        p * (l.flash > 0 ? 0.7 : 0.35)
      );

      // ---------- braços e luvas ----------
      ctx.fillStyle = pele;
      if (l.acao === "defesa") {
        ctx.fillRect(-p * 2, cy + p * 1.4, p * 4, p * 1.3);
        ctx.fillStyle = luva;
        ctx.fillRect(-p * 2.2, cy + p * 0.6, p * 1.5, p * 1.5);
        ctx.fillRect(p * 0.7, cy + p * 0.6, p * 1.5, p * 1.5);
      } else if (l.acao === "soco") {
        const estica = fase * GOLPES.soco.alcance * 0.6;
        const bx = d === 1 ? p * 2 : -p * 2 - estica;
        ctx.fillRect(bx, topo + p * 0.6, estica + p * 1, p * 1.2);
        ctx.fillStyle = luva;
        ctx.fillRect(d === 1 ? bx + estica : bx - p * 0.4, topo + p * 0.1, p * 1.6, p * 1.6);
        ctx.fillRect(d === 1 ? -p * 3 : p * 1.6, topo + p * 1.4, p * 1.4, p * 1.4);
      } else if (festejando) {
        // Os dois braços para cima — a pose de campeão.
        ctx.fillRect(-p * 3, topo - p * 2.6, p * 1.1, p * 3.4);
        ctx.fillRect(p * 1.9, topo - p * 2.6, p * 1.1, p * 3.4);
        ctx.fillStyle = luva;
        ctx.fillRect(-p * 3.2, topo - p * 4, p * 1.5, p * 1.5);
        ctx.fillRect(p * 1.7, topo - p * 4, p * 1.5, p * 1.5);
      } else if (levantando) {
        // Um braço apoiado no chão, empurrando.
        ctx.fillRect(d === 1 ? -p * 3.4 : p * 2.3, topo + p * 2.4, p * 1.1, p * 3);
        ctx.fillRect(d === 1 ? p * 2.3 : -p * 3.4, topo + p * 1, p * 1.1, p * 2.2);
        ctx.fillStyle = luva;
        ctx.fillRect(d === 1 ? -p * 3.6 : p * 2.2, topo + p * 5, p * 1.4, p * 1.4);
      } else if (caido || l.acao === "atordoado") {
        ctx.fillRect(-p * 3.4, topo + p * 2, p * 1.1, p * 2.4);
        ctx.fillRect(p * 2.3, topo + p * 2, p * 1.1, p * 2.4);
        ctx.fillStyle = luva;
        ctx.fillRect(-p * 3.6, topo + p * 4, p * 1.4, p * 1.4);
        ctx.fillRect(p * 2.2, topo + p * 4, p * 1.4, p * 1.4);
      } else {
        const bal = l.acao === "andando" ? Math.sin(quadro.current * 0.28) * p * 0.5 : respiro * 0.5;
        ctx.fillRect(-p * 3.2, topo + p * 0.9 + bal, p * 1.1, p * 2.2);
        ctx.fillRect(p * 2.1, topo + p * 0.9 - bal, p * 1.1, p * 2.2);
        // Guarda alta em repouso, como um boxeador.
        ctx.fillStyle = luva;
        ctx.fillRect(-p * 3.4, topo + p * 0.2 + bal, p * 1.5, p * 1.5);
        ctx.fillRect(p * 1.9, topo + p * 0.2 - bal, p * 1.5, p * 1.5);
      }

      if (l.flash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${l.flash / 8})`;
        ctx.fillRect(-p * 3.6, cy - p, p * 7.2, p * 12);
      }

      if (l.acao === "atordoado" || caido || levantando) {
        ctx.fillStyle = "#FBBF24";
        for (let i = 0; i < 3; i += 1) {
          const a = quadro.current * 0.14 + (i * Math.PI * 2) / 3;
          ctx.fillRect(Math.cos(a) * 15 - 2, cy - p * 2.4 + Math.sin(a) * 5, 4, 4);
        }
      }

      ctx.restore();
    };

    boneco(eu.current, "#8B5CF6", "#6B44C4", "#2A1B4A", "#C4B5FD", "#17110F");
    boneco(ele.current, "#F472B6", "#C9548E", "#4A1B33", "#FBCFE8", "#2A1018");

    /* ---------- anúncio do K.O. ----------
       Cresce de zero com um leve exagero no fim (o "estouro" clássico de
       fliperama) e depois assenta. Texto que só aparece não tem impacto. */
    if (faseRef.current === "comemorando" || faseRef.current === "fim") {
      const decorrido = DUR_COMEMORACAO - comemoraAte.current;
      const k = Math.min(1, decorrido / 22);
      const escala = k < 1 ? k * 1.35 : 1 + Math.sin((decorrido - 22) * 0.06) * 0.04;
      const ganhou = vencedor.current === "eu";

      ctx.save();
      ctx.translate(LARGURA / 2, ALTURA / 2 - 26);
      ctx.scale(escala, escala);
      ctx.textAlign = "center";

      ctx.font = "bold 46px ui-monospace, monospace";
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillText("K.O.", 3, 3);
      ctx.fillStyle = ganhou ? "#4ADE80" : "#F87171";
      ctx.fillText("K.O.", 0, 0);

      ctx.font = "bold 17px ui-monospace, monospace";
      ctx.fillStyle = "#F5F1EA";
      ctx.fillText(ganhou ? "YOU WIN" : "YOU LOSE", 0, 26);
      ctx.restore();
    }

    // ---------- partículas ----------
    for (const q of particulas.current) {
      ctx.fillStyle = q.cor;
      ctx.globalAlpha = Math.min(1, q.vida / 12);
      ctx.fillRect(q.x, q.y, q.tam, q.tam);
    }
    ctx.globalAlpha = 1;

    ctx.restore();
  }, []);

  useEffect(() => {
    desenhar();
  }, [desenhar]);

  /* ============================================================
     REGRAS
     ============================================================ */
  const iniciarAcao = useCallback((l: Lutador, acao: Acao) => {
    if (l.acao !== "parado" && l.acao !== "andando" && l.acao !== "defesa") return;
    if (l.acao === "defesa" && acao === "defesa") return;

    l.acao = acao;
    l.acertou = false;
    l.timer =
      acao === "soco"
        ? GOLPES.soco.dur
        : acao === "chute"
          ? GOLPES.chute.dur
          : acao === "defesa"
            ? DUR_DEFESA
            : 0;
  }, []);

  const resolverGolpe = useCallback(
    (atacante: Lutador, alvo: Lutador) => {
      if (atacante.acao !== "soco" && atacante.acao !== "chute") return;
      const g = GOLPES[atacante.acao];
      if (atacante.timer !== g.dur - g.impacto || atacante.acertou) return;

      atacante.acertou = true;
      const distancia = Math.abs(alvo.x - atacante.x);
      const naFrente = Math.sign(alvo.x - atacante.x) === atacante.dir;

      // Errar no vazio não faz som. Silêncio aqui é informação.
      if (distancia > g.alcance || !naFrente) return;

      // Quem está no chão (ou acabou de levantar) não apanha. É a regra que
      // impede transformar a queda em execução.
      if (alvo.intocavel > 0 || alvo.acao === "caido") return;

      const forte = atacante.acao === "chute";
      // Ponto de contato: onde a luva chega, não o centro do corpo.
      const px = atacante.x + atacante.dir * (g.alcance * 0.55);
      const py = CHAO - 58;

      if (alvo.acao === "defesa") {
        alvo.vida = Math.max(0, alvo.vida - 1);
        alvo.x = Math.max(LIMITE.min, Math.min(LIMITE.max, alvo.x + atacante.dir * 6));
        alvo.cambaleio = atacante.dir * 0.05;
        soltar(px, py, atacante.dir, false);
        tocar("bloqueio");
        torcidaVibrar(0.12);
        return;
      }

      alvo.vida = Math.max(0, alvo.vida - g.dano);
      alvo.x = Math.max(LIMITE.min, Math.min(LIMITE.max, alvo.x + atacante.dir * g.recuo));
      alvo.flash = 8;
      alvo.cambaleio = atacante.dir * (forte ? 0.34 : 0.16);
      tremor.current = forte ? 9 : 4;
      soltar(px, py, atacante.dir, forte);
      tocar(forte ? "chute" : "soco");
      // Soco limpo levanta a plateia um pouco; chute, bem mais.
      torcidaVibrar(forte ? 0.5 : 0.3);

      /*
       * A queda é OCASIONAL, não automática.
       *
       * Chute derrubando sempre virava o jogo inteiro: alguém no chão a cada
       * dez segundos, e a luta parando junto. Agora derruba quando o alvo já
       * está machucado (abaixo de 40%) ou em um terço das vezes — o resto é
       * atordoamento longo, que pune sem interromper.
       */
      const derruba = forte && (alvo.vida < VIDA_MAX * 0.4 || Math.random() < 0.34);

      if (derruba) {
        alvo.acao = "caido";
        alvo.timer = DUR_CAIDO;
        alvo.intocavel = INVULNERAVEL;
        alvo.acertou = false;
        tocar("queda");
        // Derrubar é o lance da luta: a casa vem abaixo.
        torcidaVibrar(0.88);
      } else if (forte) {
        // Chute que não derruba atordoa por mais tempo que o soco.
        alvo.acao = "atordoado";
        alvo.timer = DUR_ATORDOADO + 12;
        alvo.acertou = false;
      } else {
        // Aqui o alvo nunca está caído: a guarda no topo da função já
        // devolveu para quem está no chão ou intocável.
        alvo.acao = "atordoado";
        alvo.timer = DUR_ATORDOADO;
        alvo.acertou = false;
      }
    },
    [soltar, tocar, torcidaVibrar]
  );

  /* ============================================================
     LAÇO
     ============================================================ */
  /* A torcida acompanha o ringue: entra quando a luta começa, some quando
     ela acaba ou é pausada. */
  useEffect(() => {
    if (fase === "lutando" || fase === "comemorando") torcidaLigar();
    else torcidaDesligar();
    return () => torcidaDesligar();
  }, [fase, torcidaLigar, torcidaDesligar]);

  useEffect(() => {
    if (fase !== "lutando" && fase !== "comemorando") return;

    const passo = () => {
      quadro.current += 1;
      const meu = eu.current;
      const dele = ele.current;

      /* Na comemoração o laço continua rodando — é ele que anima o pulo, o
         K.O. crescendo e a plateia — mas nenhuma regra de combate vale. */
      if (faseRef.current === "comemorando") {
        comemoraAte.current -= 1;
        for (const l of [meu, dele]) {
          if (Math.abs(l.cambaleio) > 0.001) l.cambaleio *= 0.88;
          if (l.flash > 0) l.flash -= 1;
        }
        particulas.current = particulas.current.filter((q) => {
          q.vy += 0.28;
          q.x += q.vx;
          q.y += q.vy;
          q.vida -= 1;
          if (q.y > CHAO - 2) {
            q.y = CHAO - 2;
            q.vy = 0;
            q.vx *= 0.7;
          }
          return q.vida > 0;
        });
        if (tremor.current > 0) tremor.current *= 0.82;
        desenhar();

        if (comemoraAte.current <= 0) {
          faseRef.current = "fim";
          setFase("fim");
          return;
        }
        raf.current = requestAnimationFrame(passo);
        return;
      }

      meu.dir = dele.x >= meu.x ? 1 : -1;
      dele.dir = meu.x >= dele.x ? 1 : -1;

      // ---------- entrada ----------
      const k = teclas.current;
      const livre = meu.acao === "parado" || meu.acao === "andando" || meu.acao === "defesa";

      if (k.has("s") || k.has("arrowdown")) {
        if (livre) {
          meu.acao = "defesa";
          meu.timer = DUR_DEFESA;
        }
      } else if (meu.acao === "defesa") {
        meu.acao = "parado";
      }

      if (k.has("j")) iniciarAcao(meu, "soco");
      else if (k.has("k")) iniciarAcao(meu, "chute");

      if (meu.acao === "parado" || meu.acao === "andando") {
        const esq = k.has("arrowleft") || k.has("a");
        const dir = k.has("arrowright") || k.has("d");
        if (esq !== dir) {
          meu.x = Math.max(
            LIMITE.min,
            Math.min(LIMITE.max, meu.x + (dir ? VELOCIDADE : -VELOCIDADE))
          );
          meu.acao = "andando";
        } else {
          meu.acao = "parado";
        }
      }

      // ---------- adversário ----------
      const distancia = Math.abs(dele.x - meu.x);
      if (
        quadro.current >= iaProximo.current &&
        (dele.acao === "parado" || dele.acao === "andando")
      ) {
        if (distancia > GOLPES.chute.alcance - 4) {
          dele.x += Math.sign(meu.x - dele.x) * VELOCIDADE * 0.85;
          dele.acao = "andando";
        } else {
          const sorte = Math.random();
          const meuGolpe = meu.acao === "soco" || meu.acao === "chute";
          const noChao = meu.acao === "caido";
          if (noChao) {
            /* Adversário recua e espera enquanto você está no chão. Ficar
               batendo em quem não pode revidar não é difícil — é chato. */
            dele.x -= Math.sign(meu.x - dele.x) * VELOCIDADE * 1.4;
            dele.acao = "andando";
          } else if (meuGolpe && sorte > 0.55) {
            dele.acao = "defesa";
            dele.timer = DUR_DEFESA + 6;
          } else if (sorte > 0.62) {
            iniciarAcao(dele, "chute");
          } else if (sorte > 0.22) {
            iniciarAcao(dele, "soco");
          } else {
            dele.x -= Math.sign(meu.x - dele.x) * VELOCIDADE * 2;
            dele.acao = "andando";
          }
          iaProximo.current = quadro.current + 18 + Math.floor(Math.random() * 26);
        }
        dele.x = Math.max(LIMITE.min, Math.min(LIMITE.max, dele.x));
      }

      resolverGolpe(meu, dele);
      resolverGolpe(dele, meu);

      // ---------- decaimentos ----------
      for (const l of [meu, dele]) {
        if (l.timer > 0) {
          l.timer -= 1;
          if (l.timer === 0) {
            // Cair encadeia direto em levantar — sem pausa entre os dois.
            if (l.acao === "caido") {
              l.acao = "levantando";
              l.timer = DUR_LEVANTANDO;
            } else {
              l.acao = "parado";
            }
          }
        }
        if (l.flash > 0) l.flash -= 1;
        if (l.intocavel > 0) l.intocavel -= 1;
        // O cambaleio volta ao prumo sozinho, mais devagar que o flash.
        if (Math.abs(l.cambaleio) > 0.001) l.cambaleio *= 0.88;
      }

      if (tremor.current > 0) tremor.current *= 0.82;

      particulas.current = particulas.current.filter((q) => {
        q.vy += 0.28;
        q.x += q.vx;
        q.y += q.vy;
        q.vx *= 0.98;
        q.vida -= 1;
        // Pousa no chão em vez de atravessar.
        if (q.y > CHAO - 2) {
          q.y = CHAO - 2;
          q.vy = 0;
          q.vx *= 0.7;
        }
        return q.vida > 0;
      });

      // Ninguém ocupa o mesmo lugar — exceto quem está no chão.
      const noChaoAlgum =
        meu.acao === "caido" ||
        dele.acao === "caido" ||
        meu.acao === "levantando" ||
        dele.acao === "levantando";
      if (!noChaoAlgum && Math.abs(dele.x - meu.x) < 40) {
        const empurra = (40 - Math.abs(dele.x - meu.x)) / 2;
        const s = Math.sign(dele.x - meu.x) || 1;
        meu.x = Math.max(LIMITE.min, meu.x - s * empurra);
        dele.x = Math.min(LIMITE.max, dele.x + s * empurra);
      }

      setVidas({ eu: meu.vida, ele: dele.vida });
      desenhar();

      if (meu.vida <= 0 || dele.vida <= 0) {
        const ganhou = dele.vida <= 0;
        vencedor.current = ganhou ? "eu" : "ele";
        setFim(ganhou ? "ganhou" : "perdeu");

        // Entra na comemoração: o vencedor pula, o perdedor fica no chão.
        const campeao = ganhou ? meu : dele;
        const perdedor = ganhou ? dele : meu;
        campeao.acao = "comemorando";
        campeao.timer = 0;
        campeao.flash = 0;
        perdedor.acao = "caido";
        perdedor.timer = 0;
        // Sem isto o flash do último golpe fica congelado e vira uma caixa
        // branca em volta do corpo no chão.
        perdedor.flash = 0;
        perdedor.intocavel = 9999;

        comemoraAte.current = DUR_COMEMORACAO;
        faseRef.current = "comemorando";
        setFase("comemorando");
        tocar("queda");
        tocar(ganhou ? "vitoria" : "derrota");
        torcidaVibrar(1);
      }

      raf.current = requestAnimationFrame(passo);
    };

    raf.current = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf.current);
  }, [fase, desenhar, iniciarAcao, resolverGolpe, tocar, torcidaVibrar]);

  /* ---------- teclado ---------- */
  useEffect(() => {
    if (fase !== "lutando" && fase !== "pausado") return;
    // Cópia local: no cleanup a ref já pode apontar para outro objeto.
    const apertadas = teclas.current;
    const usadas = ["arrowleft", "arrowright", "arrowdown", "a", "d", "s", "j", "k"];

    const baixo = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();

      // P e Esc alternam a pausa, e valem inclusive já pausado.
      if (k === "p" || k === "escape") {
        e.preventDefault();
        apertadas.clear();
        setFase((f) => {
          const proxima = f === "pausado" ? "lutando" : "pausado";
          faseRef.current = proxima;
          return proxima;
        });
        return;
      }

      if (fase !== "lutando") return;
      if (!usadas.includes(k)) return;
      e.preventDefault();
      apertadas.add(k);
    };
    const cima = (e: KeyboardEvent) => apertadas.delete(e.key.toLowerCase());
    // Perder o foco com a tecla apertada deixaria o boneco andando sozinho.
    const limpar = () => apertadas.clear();

    window.addEventListener("keydown", baixo, { passive: false });
    window.addEventListener("keyup", cima);
    window.addEventListener("blur", limpar);
    return () => {
      window.removeEventListener("keydown", baixo);
      window.removeEventListener("keyup", cima);
      window.removeEventListener("blur", limpar);
      apertadas.clear();
    };
  }, [fase]);

  const comecar = () => {
    eu.current = novo(160, 1);
    ele.current = novo(360, -1);
    teclas.current.clear();
    particulas.current = [];
    tremor.current = 0;
    quadro.current = 0;
    iaProximo.current = 70;
    vencedor.current = null;
    comemoraAte.current = 0;
    setVidas({ eu: VIDA_MAX, ele: VIDA_MAX });
    setFim(null);
    faseRef.current = "lutando";
    setFase("lutando");
  };

  const alternarPausa = () => {
    teclas.current.clear();
    setFase((f) => {
      const proxima = f === "pausado" ? "lutando" : "pausado";
      faseRef.current = proxima;
      return proxima;
    });
  };

  const botao = (tecla: string, rotulo: string, cor: string) => (
    <button
      key={tecla}
      type="button"
      disabled={!rodando}
      onPointerDown={(e) => {
        e.preventDefault();
        teclas.current.add(tecla);
      }}
      onPointerUp={() => teclas.current.delete(tecla)}
      onPointerLeave={() => teclas.current.delete(tecla)}
      className={`select-none border-2 bg-transparent py-3 font-mono text-[0.625rem] uppercase tracking-[0.08em] transition-opacity disabled:opacity-35 ${cor}`}
    >
      {rotulo}
    </button>
  );

  /**
   * Barra de vida em duas camadas. A de baixo (clara) esvazia devagar e é o
   * que deixa o dano do último golpe VISÍVEL por um instante — sem ela, a
   * barra só encolhe e ninguém percebe quanto levou.
   */
  const barra = (valor: number, cor: string, invertida: boolean) => (
    <div className="relative h-4 w-full border-2 border-bone/25 bg-sky-top">
      <div
        className={`absolute inset-y-0 h-full bg-bone/30 transition-[width] duration-700 ${invertida ? "right-0" : "left-0"}`}
        style={{ width: `${valor}%` }}
      />
      <div
        className={`absolute inset-y-0 h-full transition-[width] duration-150 ${invertida ? "right-0" : "left-0"}`}
        style={{ width: `${valor}%`, background: cor }}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {barra(vidas.eu, "var(--color-iris)", false)}
        <span className="pixel-body shrink-0 text-cloud-rose">VS</span>
        {barra(vidas.ele, "var(--color-px-pink)", true)}
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={LARGURA}
          height={ALTURA}
          className="pixelated w-full touch-none border-2 border-px-pink/60 bg-sky-top"
        />

        {/* Pausa: botão no canto do ringue, sempre no mesmo lugar. Só aparece
            com a luta em andamento — pausar menu não significa nada. */}
        {fase === "lutando" || fase === "pausado" ? (
          <button
            type="button"
            onClick={alternarPausa}
            aria-label={t(fase === "pausado" ? arcade.luta.retomar : arcade.luta.pausar)}
            className="absolute right-2 top-2 z-10 border-2 border-bone/40 bg-sky-top/80 px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-bone transition-colors hover:border-bone"
          >
            {fase === "pausado" ? "▶" : "❚❚"}
          </button>
        ) : null}

        {/* A comemoração roda NO canvas — nenhuma cortina por cima dela. */}
        {fase === "pausado" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-sky-top/85 p-4 text-center">
            <p className="pixel-title m-0 text-[0.75rem] text-bone">
              {t(arcade.luta.pausado)}
            </p>
            <button
              type="button"
              onClick={alternarPausa}
              className="border-2 border-neon bg-transparent px-4 py-2 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-neon transition-colors hover:bg-neon hover:text-sky-top"
            >
              {t(arcade.luta.retomar)}
            </button>
            <p className="pixel-body m-0 text-cloud-rose">{t(arcade.luta.dicaPausa)}</p>
          </div>
        ) : null}

        {fase === "pronto" || fase === "fim" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-sky-top/90 p-4 text-center">
            <p className="pixel-title m-0 text-[0.6875rem] leading-relaxed text-px-pink">
              {fim === "ganhou"
                ? t(arcade.luta.ganhou)
                : fim === "perdeu"
                  ? t(arcade.luta.perdeu)
                  : t(arcade.luta.nome)}
            </p>
            <p className="pixel-body m-0 max-w-[34ch] text-cloud-rose">{t(arcade.luta.como)}</p>
            <button
              type="button"
              onClick={comecar}
              className="border-2 border-px-pink bg-transparent px-4 py-2 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-px-pink transition-colors hover:bg-px-pink hover:text-sky-top"
            >
              {fim ? t(arcade.denovo) : t(arcade.jogar)}
            </button>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {botao("arrowleft", "←", "border-bone/40 text-bone")}
        {botao("arrowright", "→", "border-bone/40 text-bone")}
        {botao("j", t(arcade.luta.fraco), "border-cozy-blue text-cozy-blue")}
        {botao("k", t(arcade.luta.forte), "border-px-pink text-px-pink")}
        {botao("s", t(arcade.luta.defesa), "border-neon text-neon")}
      </div>
    </div>
  );
}
