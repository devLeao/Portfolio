"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

/**
 * Som do site inteiro: um toggle só governa o switch do teclado e o twinkle
 * do portal. Mudo por padrão — som que toca sem pedir licença é a forma mais
 * rápida de alguém fechar a aba.
 *
 * Nenhum arquivo é baixado. Os dois sons são sintetizados com Web Audio:
 * o switch é ruído filtrado com envelope curtíssimo, o twinkle é um trio de
 * senoides. Juntos custam zero byte de rede.
 */

/**
 * Todos os sons do site, sintetizados.
 *
 * Nenhum arquivo é baixado. Um pacote de efeitos decente custaria 300–800KB;
 * aqui cada som é uma receita de osciladores e ruído, e o conjunto inteiro
 * custa zero byte de rede.
 *
 * A regra que rege as receitas: som de interface é CURTO. Nada passa de
 * 0,4s, porque um efeito que se arrasta atrapalha quem está jogando.
 */
type Som =
  | "switch"
  | "twinkle"
  /* arcade */
  | "comer"
  | "virar"
  | "acerto"
  | "erro"
  | "soco"
  | "chute"
  | "queda"
  | "bloqueio"
  | "motor"
  | "batida"
  | "vitoria"
  | "derrota";

/**
 * Sons CONTÍNUOS, diferentes dos de evento.
 *
 * Motor e música não são disparos: eles ligam, ficam, mudam e desligam.
 * Precisam de nós de áudio persistentes — criar um oscilador por quadro
 * estouraria o contexto em segundos.
 */
type Continuo = {
  /** Liga o ronco do motor. `intensidade` 0..1 governa rotação e volume. */
  motorLigar: () => void;
  motorAjustar: (intensidade: number) => void;
  motorDesligar: () => void;
  /** Loop de fundo do arcade. */
  musicaLigar: () => void;
  musicaDesligar: () => void;
  /** Murmúrio da plateia enquanto a luta acontece. */
  torcidaLigar: () => void;
  torcidaDesligar: () => void;
  /** A plateia reage a um lance. `forca`: 0 roçou, 1 nocaute. */
  torcidaVibrar: (forca?: number) => void;
};

type Ctx = {
  ligado: boolean;
  alternar: () => void;
  tocar: (som: Som) => void;
} & Continuo;

const SoundCtx = createContext<Ctx>({
  ligado: false,
  alternar: () => {},
  tocar: () => {},
  motorLigar: () => {},
  motorAjustar: () => {},
  motorDesligar: () => {},
  musicaLigar: () => {},
  musicaDesligar: () => {},
  torcidaLigar: () => {},
  torcidaDesligar: () => {},
  torcidaVibrar: () => {},
});

const CHAVE = "leandro:som";

/**
 * As alturas do coro da torcida — deliberadamente fora de escala.
 *
 * Alturas em intervalos musicais formam um ACORDE, e acorde soa a
 * sintetizador. Espalhadas assim, sem relação harmônica entre si, viram
 * gente.
 */
const ALTURAS_TORCIDA = [101, 129, 152, 178, 207, 241, 276, 318];

/** Formantes da vogal aberta ("a"): é o par que faz o dente-de-serra virar voz. */
const FORMANTE_1 = 700;
const FORMANTE_2 = 1150;

type Voz = {
  osc: OscillatorNode;
  f1: BiquadFilterNode;
  f2: BiquadFilterNode;
  base: number;
};

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [ligado, setLigado] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const ruidoRef = useRef<AudioBuffer | null>(null);

  // A preferência sobrevive ao reload; a decisão de ligar é sempre do usuário.
  useEffect(() => {
    try {
      setLigado(window.localStorage.getItem(CHAVE) === "1");
    } catch {
      /* modo privado bloqueia storage — segue mudo, que é o padrão certo */
    }
  }, []);

  const alternar = useCallback(() => {
    setLigado((anterior) => {
      const proximo = !anterior;
      try {
        window.localStorage.setItem(CHAVE, proximo ? "1" : "0");
      } catch {
        /* idem */
      }
      return proximo;
    });
  }, []);

  const audio = useCallback((): AudioContext | null => {
    if (typeof window === "undefined") return null;

    if (!ctxRef.current) {
      const Ctor = window.AudioContext ?? (window as unknown as {
        webkitAudioContext?: typeof AudioContext;
      }).webkitAudioContext;
      if (!Ctor) return null;
      ctxRef.current = new Ctor();
    }

    // Navegador suspende o contexto até haver gesto do usuário. Como só
    // tocamos depois de clique ou tecla, retomar aqui é seguro.
    if (ctxRef.current.state === "suspended") void ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const tocar = useCallback(
    (som: Som) => {
      if (!ligado) return;
      const ctx = audio();
      if (!ctx) return;

      const agora = ctx.currentTime;

      if (som === "switch") {
        // Ruído branco de 0,12s, reaproveitado a cada toque.
        if (!ruidoRef.current) {
          const amostras = Math.floor(ctx.sampleRate * 0.12);
          const buffer = ctx.createBuffer(1, amostras, ctx.sampleRate);
          const dados = buffer.getChannelData(0);
          for (let i = 0; i < amostras; i += 1) dados[i] = Math.random() * 2 - 1;
          ruidoRef.current = buffer;
        }

        const fonte = ctx.createBufferSource();
        fonte.buffer = ruidoRef.current;

        // Passa-banda alto: switch mecânico é estalo, não trovão.
        const filtro = ctx.createBiquadFilter();
        filtro.type = "bandpass";
        filtro.frequency.value = 2400;
        filtro.Q.value = 1.1;

        const ganho = ctx.createGain();
        ganho.gain.setValueAtTime(0.0001, agora);
        ganho.gain.exponentialRampToValueAtTime(0.22, agora + 0.004);
        ganho.gain.exponentialRampToValueAtTime(0.0001, agora + 0.09);

        fonte.connect(filtro).connect(ganho).connect(ctx.destination);
        fonte.start(agora);
        fonte.stop(agora + 0.12);
        return;
      }

      /* ---------- receitas ----------
         `bipe` cobre quase tudo: uma nota com envelope curto e um tipo de
         onda. Quadrada soa a fliperama, senoide soa a interface. */
      const bipe = (
        hz: number,
        dur: number,
        tipo: OscillatorType = "square",
        vol = 0.07,
        atraso = 0,
        hzFinal?: number
      ) => {
        const osc = ctx.createOscillator();
        const ganho = ctx.createGain();
        const inicio = agora + atraso;

        osc.type = tipo;
        osc.frequency.setValueAtTime(hz, inicio);
        // Varredura de frequência é o que dá "vida" ao efeito: subir soa a
        // ganho, descer soa a perda. O ouvido lê isso antes da melodia.
        if (hzFinal) osc.frequency.exponentialRampToValueAtTime(hzFinal, inicio + dur);

        ganho.gain.setValueAtTime(0.0001, inicio);
        ganho.gain.exponentialRampToValueAtTime(vol, inicio + 0.012);
        ganho.gain.exponentialRampToValueAtTime(0.0001, inicio + dur);

        osc.connect(ganho).connect(ctx.destination);
        osc.start(inicio);
        osc.stop(inicio + dur + 0.02);
      };

      /** Ruído filtrado — a base de impacto, colisão e motor. */
      const ruido = (
        dur: number,
        freq: number,
        q: number,
        vol: number,
        tipo: BiquadFilterType = "bandpass"
      ) => {
        const amostras = Math.floor(ctx.sampleRate * dur);
        const buffer = ctx.createBuffer(1, amostras, ctx.sampleRate);
        const dados = buffer.getChannelData(0);
        for (let i = 0; i < amostras; i += 1) dados[i] = Math.random() * 2 - 1;

        const fonte = ctx.createBufferSource();
        fonte.buffer = buffer;

        const filtro = ctx.createBiquadFilter();
        filtro.type = tipo;
        filtro.frequency.value = freq;
        filtro.Q.value = q;

        const ganho = ctx.createGain();
        ganho.gain.setValueAtTime(vol, agora);
        ganho.gain.exponentialRampToValueAtTime(0.0001, agora + dur);

        fonte.connect(filtro).connect(ganho).connect(ctx.destination);
        fonte.start(agora);
        fonte.stop(agora + dur);
      };

      switch (som) {
        case "twinkle":
          // três senoides subindo, o clichê sonoro de portal
          [880, 1320, 1760].forEach((hz, i) => bipe(hz, 0.35, "sine", 0.07, i * 0.07));
          return;

        case "comer":
          // sobe: a cobra ganhou alguma coisa
          bipe(520, 0.09, "square", 0.06, 0, 900);
          bipe(900, 0.07, "square", 0.045, 0.07, 1250);
          return;

        case "virar":
          // clique seco e neutro — vira dezenas de vezes por partida
          bipe(680, 0.05, "triangle", 0.045);
          return;

        case "acerto":
          // terça maior ascendente: o acorde que o ouvido lê como "certo"
          bipe(660, 0.12, "square", 0.055);
          bipe(880, 0.16, "square", 0.055, 0.08);
          return;

        case "erro":
          // desce e some — o oposto exato do acerto
          bipe(300, 0.18, "sawtooth", 0.045, 0, 170);
          return;

        case "soco":
          // impacto grave + estalo agudo, que é como soco soa
          ruido(0.14, 260, 0.9, 0.3, "lowpass");
          bipe(150, 0.12, "sawtooth", 0.06, 0, 60);
          return;

        case "chute":
          /* Mais grave, mais longo e com um estalo de couro por cima: chute
             precisa soar MAIS PESADO que soco, senão os dois viram o mesmo
             botão para o ouvido. */
          ruido(0.26, 150, 0.7, 0.38, "lowpass");
          ruido(0.07, 3200, 1.4, 0.16);
          bipe(96, 0.22, "sawtooth", 0.075, 0, 38);
          return;

        case "queda":
          // corpo no chão: baque surdo e uma reverberação curta
          ruido(0.4, 90, 0.5, 0.42, "lowpass");
          bipe(62, 0.34, "sine", 0.09, 0, 30);
          bipe(48, 0.5, "sine", 0.05, 0.1, 26);
          return;

        case "bloqueio":
          // mais curto e mais agudo: bateu na guarda, não no corpo
          ruido(0.08, 1800, 1.5, 0.16);
          return;

        case "motor":
          // rosnado curto de aceleração
          bipe(90, 0.22, "sawtooth", 0.05, 0, 150);
          return;

        case "batida":
          ruido(0.3, 500, 0.7, 0.34, "lowpass");
          bipe(110, 0.28, "square", 0.05, 0, 45);
          return;

        case "vitoria":
          // arpejo maior: dó–mi–sol–dó
          [523, 659, 784, 1047].forEach((hz, i) =>
            bipe(hz, 0.18, "square", 0.06, i * 0.09)
          );
          return;

        case "derrota":
          // o mesmo arpejo ao contrário e em menor
          [392, 330, 262].forEach((hz, i) => bipe(hz, 0.22, "square", 0.055, i * 0.12));
          return;
      }
    },
    [ligado, audio]
  );

  /* ============================================================
     MOTOR

     Dois dentes-de-serra levemente desafinados um do outro. É a
     desafinação que faz soar a MOTOR e não a apito: batimento entre
     frequências próximas produz o ronco irregular que o ouvido
     reconhece. Um oscilador só soaria a videogame dos anos 70.
     ============================================================ */
  const motorRef = useRef<{
    osc: OscillatorNode[];
    ganho: GainNode;
    filtro: BiquadFilterNode;
  } | null>(null);

  const motorLigar = useCallback(() => {
    if (!ligado || motorRef.current) return;
    const ctx = audio();
    if (!ctx) return;

    const ganho = ctx.createGain();
    ganho.gain.value = 0.0001;

    // Passa-baixa: sem ele o dente-de-serra fica áspero e cansa em segundos.
    const filtro = ctx.createBiquadFilter();
    filtro.type = "lowpass";
    filtro.frequency.value = 700;

    const osc = [0, 1].map((i) => {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = 55 + i * 1.6;
      o.connect(filtro);
      o.start();
      return o;
    });

    filtro.connect(ganho).connect(ctx.destination);
    motorRef.current = { osc, ganho, filtro };
  }, [ligado, audio]);

  const motorAjustar = useCallback((intensidade: number) => {
    const m = motorRef.current;
    const ctx = ctxRef.current;
    if (!m || !ctx) return;

    const i = Math.max(0, Math.min(1, intensidade));
    const agora = ctx.currentTime;

    // Rampa curta em vez de atribuição direta: mudar frequência de uma vez
    // produz um estalo audível a cada quadro.
    m.osc.forEach((o, k) => {
      o.frequency.linearRampToValueAtTime(52 + i * 42 + k * 1.6, agora + 0.08);
    });
    m.filtro.frequency.linearRampToValueAtTime(620 + i * 520, agora + 0.08);
    m.ganho.gain.linearRampToValueAtTime(0.03 + i * 0.018, agora + 0.08);
  }, []);

  const motorDesligar = useCallback(() => {
    const m = motorRef.current;
    const ctx = ctxRef.current;
    motorRef.current = null;
    if (!m || !ctx) return;

    // Desliga com rampa e só então para os osciladores: cortar seco estala.
    m.ganho.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
    m.osc.forEach((o) => o.stop(ctx.currentTime + 0.3));
  }, []);

  /* ============================================================
     MÚSICA

     Um baixo em loop de oito notas, bem baixo no volume. A regra aqui
     é não competir com os efeitos: música de arcade que abafa o som do
     soco atrapalha o jogo em vez de ambientá-lo.
     ============================================================ */
  const musicaRef = useRef<number | null>(null);

  const musicaLigar = useCallback(() => {
    if (!ligado || musicaRef.current !== null) return;
    const ctx = audio();
    if (!ctx) return;

    // Menor natural: soa a arcade sem soar a alegria forçada.
    const notas = [110, 110, 165, 110, 147, 110, 131, 98];
    let i = 0;

    const passo = () => {
      const c = ctxRef.current;
      if (!c) return;
      const hz = notas[i % notas.length] ?? 110;
      i += 1;

      const osc = c.createOscillator();
      const g = c.createGain();
      const agora = c.currentTime;

      osc.type = "triangle";
      osc.frequency.value = hz;
      g.gain.setValueAtTime(0.0001, agora);
      g.gain.exponentialRampToValueAtTime(0.03, agora + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, agora + 0.22);

      osc.connect(g).connect(c.destination);
      osc.start(agora);
      osc.stop(agora + 0.24);
    };

    passo();
    musicaRef.current = window.setInterval(passo, 260);
  }, [ligado, audio]);

  const musicaDesligar = useCallback(() => {
    if (musicaRef.current === null) return;
    window.clearInterval(musicaRef.current);
    musicaRef.current = null;
  }, []);

  /* ============================================================
     TORCIDA

     ---------- por que a primeira versão soava a vento ----------
     Era ruído rosa passado por um passa-banda. Essa é, literalmente, a
     receita de vento — e foi exatamente isso que se ouviu. O erro não estava
     no ajuste: ruído não tem ALTURA, e plateia é feita de vozes, que têm.

     Aqui cada voz é um dente-de-serra (rico em harmônicos, como prega vocal)
     passado por dois passa-banda nas frequências dos formantes da vogal
     aberta — ~700Hz e ~1150Hz, o "a". Uma voz sozinha soa a robô. Oito, com
     alturas espalhadas FORA de escala e cada uma derivando no seu próprio
     ritmo, soam a gente: é o desencontro entre elas que o ouvido lê como
     multidão, não a textura de cada uma.

     São duas camadas:

       · LEITO — contínuo e baixo, o murmúrio de quem está lá esperando.
       · REAÇÃO — disparada a cada golpe e a cada queda. As vozes sobem de
         altura e os formantes sobem JUNTO, que é o gesto acústico de abrir a
         boca: é isso que vira "oooh!" em vez de sirene. Por cima entram
         gritos avulsos e palmas, e quanto mais forte o lance, mais de cada.

     A reação mexe no ganho do leito inteiro, e não toca um coro separado por
     cima. A diferença importa: é a MESMA plateia que se anima, e é isso que
     amarra o som ao que aconteceu no ringue.
     ============================================================ */

  const torcidaRef = useRef<{
    leito: GainNode;
    vozes: Voz[];
    parar: (quando: number) => void;
  } | null>(null);

  /** Última reação, para não empilhar disparos numa sequência rápida de socos. */
  const ultimaReacao = useRef(0);

  /** Ruído curtíssimo para as palmas, criado uma vez e reaproveitado. */
  const palmaRef = useRef<AudioBuffer | null>(null);
  const bufferPalma = useCallback((ctx: AudioContext) => {
    if (!palmaRef.current) {
      const n = Math.floor(ctx.sampleRate * 0.06);
      const b = ctx.createBuffer(1, n, ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < n; i += 1) d[i] = Math.random() * 2 - 1;
      palmaRef.current = b;
    }
    return palmaRef.current;
  }, []);

  const torcidaLigar = useCallback(() => {
    if (!ligado || torcidaRef.current) return;
    const ctx = audio();
    if (!ctx) return;

    const agora = ctx.currentTime;

    const leito = ctx.createGain();
    leito.gain.setValueAtTime(0.0001, agora);
    // Entrada em rampa: plateia que aparece de uma vez soa a botão de rádio.
    leito.gain.linearRampToValueAtTime(0.55, agora + 1.1);

    /*
     * Compressor antes da saída. Oito vozes somando produzem picos que
     * estouram, e som estourado volta a soar a ruído — desfazendo justamente
     * o que as vozes conquistaram. Ele cola tudo num bloco só, que é como
     * multidão chega ao ouvido de verdade: uma massa, não vozes contáveis.
     */
    const cola = ctx.createDynamicsCompressor();
    cola.threshold.setValueAtTime(-26, agora);
    cola.ratio.setValueAtTime(7, agora);
    cola.attack.setValueAtTime(0.006, agora);
    cola.release.setValueAtTime(0.25, agora);
    leito.connect(cola).connect(ctx.destination);

    const osciladores: OscillatorNode[] = [];

    const vozes: Voz[] = ALTURAS_TORCIDA.map((hz, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(hz, agora);

      // Deriva lenta de altura. Voz absolutamente parada denuncia o
      // oscilador; ninguém segura uma nota exata por minutos.
      const deriva = ctx.createOscillator();
      deriva.frequency.setValueAtTime(0.07 + i * 0.031, agora);
      const derivaG = ctx.createGain();
      derivaG.gain.setValueAtTime(hz * 0.022, agora);
      deriva.connect(derivaG).connect(osc.frequency);

      /*
       * Os dois formantes em PARALELO, e não em série.
       *
       * Em série o segundo passa-banda recebe o que o primeiro deixou passar
       * — uma faixa de ~130Hz em volta de 700 — e corta justamente essa faixa,
       * porque ele está centrado em 1150. Sobra um fiapo nasal e quase mudo.
       * A medição pegou isso: energia nos harmônicos abaixo dos vizinhos.
       *
       * Trato vocal tem ressonâncias SIMULTÂNEAS. Em paralelo, cada filtro
       * pega a sua faixa do mesmo dente-de-serra e as duas se somam — que é o
       * que produz vogal.
       */
      const f1 = ctx.createBiquadFilter();
      f1.type = "bandpass";
      f1.frequency.setValueAtTime(FORMANTE_1, agora);
      f1.Q.setValueAtTime(5.5, agora);

      const f2 = ctx.createBiquadFilter();
      f2.type = "bandpass";
      f2.frequency.setValueAtTime(FORMANTE_2, agora);
      f2.Q.setValueAtTime(7, agora);

      // F2 entra mais baixo: no "a" o primeiro formante domina, e igualar os
      // dois dá aquele timbre de vogal fechada, entre "i" e "e".
      const nivelF2 = ctx.createGain();
      nivelF2.gain.setValueAtTime(0.55, agora);

      /* 0,26 e não 0,34: medido num contexto offline, o leito ficava em RMS
         0,095, que compete com os sons do jogo em vez de sustentá-los.
         Plateia de fundo tem que caber DEBAIXO do soco. */
      const ganho = ctx.createGain();
      ganho.gain.setValueAtTime(0.26, agora);

      // Respiração individual, em períodos primos entre si: se todas
      // subissem e descessem juntas o conjunto pulsaria, e pulso é ritmo —
      // plateia não tem ritmo.
      const resp = ctx.createOscillator();
      resp.frequency.setValueAtTime(0.11 + i * 0.043, agora);
      const respG = ctx.createGain();
      respG.gain.setValueAtTime(0.16, agora);
      resp.connect(respG).connect(ganho.gain);

      // Duas derivações do MESMO oscilador, somadas no ganho da voz.
      osc.connect(f1).connect(ganho);
      osc.connect(f2).connect(nivelF2).connect(ganho);
      ganho.connect(leito);

      osc.start();
      deriva.start();
      resp.start();
      osciladores.push(osc, deriva, resp);

      return { osc, f1, f2, base: hz };
    });

    torcidaRef.current = {
      leito,
      vozes,
      parar: (quando) => osciladores.forEach((o) => o.stop(quando)),
    };
  }, [ligado, audio]);

  /**
   * A plateia reage. `forca` vai de 0 (roçou) a 1 (nocaute).
   *
   * Funciona com ou sem o leito no ar: os gritos e as palmas são avulsos, e
   * o degrau no leito só acontece se ele existir.
   */
  const torcidaVibrar = useCallback(
    (forca = 0.5) => {
      if (!ligado) return;
      const ctx = audio();
      if (!ctx) return;

      const agora = ctx.currentTime;
      // Numa sequência rápida de socos, reações empilhadas viram um borrão
      // alto e contínuo. A primeira ganha, as seguidas esperam.
      if (agora - ultimaReacao.current < 0.16) return;
      ultimaReacao.current = agora;

      const dur = 0.5 + forca * 1.4;
      const tr = torcidaRef.current;

      if (tr) {
        // 1. O leito inteiro sobe e volta.
        const g = tr.leito.gain;
        g.cancelScheduledValues(agora);
        g.setValueAtTime(g.value, agora);
        g.linearRampToValueAtTime(0.55 + forca * 0.85, agora + 0.09);
        g.linearRampToValueAtTime(0.55, agora + dur);

        // 2. As vozes sobem de altura E abrem a boca. Os dois juntos: subir
        //    só a altura dá sirene, subir só o formante dá filtro varrendo.
        for (const v of tr.vozes) {
          const alvo = v.base * (1.16 + forca * 0.3);
          v.osc.frequency.cancelScheduledValues(agora);
          v.osc.frequency.setValueAtTime(v.base, agora);
          v.osc.frequency.linearRampToValueAtTime(alvo, agora + 0.15);
          v.osc.frequency.linearRampToValueAtTime(v.base, agora + dur);

          for (const [filtro, repouso, aberto] of [
            [v.f1, FORMANTE_1, FORMANTE_1 + 190 * forca] as const,
            [v.f2, FORMANTE_2, FORMANTE_2 + 420 * forca] as const,
          ]) {
            filtro.frequency.cancelScheduledValues(agora);
            filtro.frequency.setValueAtTime(repouso, agora);
            filtro.frequency.linearRampToValueAtTime(aberto, agora + 0.15);
            filtro.frequency.linearRampToValueAtTime(repouso, agora + dur);
          }
        }
      }

      /*
       * 3. Os gritos: quem levanta a voz acima do resto. São eles que dão o
       *    pico do "AAAH", e existem só enquanto dura a reação. Cada um entra
       *    num instante próprio — plateia gritando em uníssono soa a coral.
       */
      const gritos = 2 + Math.round(forca * 7);
      for (let i = 0; i < gritos; i += 1) {
        const hz = 155 + Math.random() * 250;
        const t0 = agora + Math.random() * 0.13;
        const t1 = t0 + 0.3 + Math.random() * dur * 0.6;

        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(hz, t0);
        osc.frequency.linearRampToValueAtTime(hz * 1.22, t0 + 0.12);
        osc.frequency.linearRampToValueAtTime(hz * 0.92, t1);

        const f1 = ctx.createBiquadFilter();
        f1.type = "bandpass";
        f1.frequency.setValueAtTime(760, t0);
        f1.frequency.linearRampToValueAtTime(940, t0 + 0.12);
        f1.Q.setValueAtTime(6, t0);

        const f2 = ctx.createBiquadFilter();
        f2.type = "bandpass";
        f2.frequency.setValueAtTime(1250, t0);
        f2.frequency.linearRampToValueAtTime(1620, t0 + 0.12);
        f2.Q.setValueAtTime(8, t0);

        const nivelF2 = ctx.createGain();
        nivelF2.gain.setValueAtTime(0.55, t0);

        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.06 + forca * 0.05, t0 + 0.07);
        g.gain.exponentialRampToValueAtTime(0.0001, t1);

        // Formantes em paralelo, como no leito — ver a nota em `torcidaLigar`.
        osc.connect(f1).connect(g);
        osc.connect(f2).connect(nivelF2).connect(g);
        g.connect(ctx.destination);

        osc.start(t0);
        osc.stop(t1 + 0.02);
      }

      /*
       * 4. Palmas, só nas reações grandes. Transiente puro: ruído de 60ms com
       *    passa-alta. Espalhadas com folga aleatória e cada uma com o seu
       *    corte — palmas em grade soam a metrônomo, e ninguém aplaude no
       *    compasso.
       */
      const palmas = Math.round(forca * forca * 22);
      for (let i = 0; i < palmas; i += 1) {
        const t = agora + 0.04 + Math.random() * dur * 0.8;
        const fonte = ctx.createBufferSource();
        fonte.buffer = bufferPalma(ctx);

        const hp = ctx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.setValueAtTime(1100 + Math.random() * 1500, t);

        const g = ctx.createGain();
        g.gain.setValueAtTime(0.035 + Math.random() * 0.04, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);

        fonte.connect(hp).connect(g).connect(ctx.destination);
        fonte.start(t);
        fonte.stop(t + 0.06);
      }
    },
    [ligado, audio, bufferPalma]
  );

  const torcidaDesligar = useCallback(() => {
    const tr = torcidaRef.current;
    const ctx = ctxRef.current;
    torcidaRef.current = null;
    if (!tr || !ctx) return;

    const agora = ctx.currentTime;
    tr.leito.gain.cancelScheduledValues(agora);
    tr.leito.gain.setValueAtTime(tr.leito.gain.value, agora);
    tr.leito.gain.linearRampToValueAtTime(0.0001, agora + 0.55);
    tr.parar(agora + 0.6);
  }, []);

  // Desligar o som pelo toggle tem que calar o que já está tocando, não só
  // impedir o próximo disparo.
  useEffect(() => {
    if (!ligado) {
      motorDesligar();
      musicaDesligar();
      torcidaDesligar();
    }
  }, [ligado, motorDesligar, musicaDesligar, torcidaDesligar]);

  useEffect(
    () => () => {
      motorDesligar();
      musicaDesligar();
      torcidaDesligar();
    },
    [motorDesligar, musicaDesligar, torcidaDesligar]
  );

  return (
    <SoundCtx.Provider
      value={{
        ligado,
        alternar,
        tocar,
        motorLigar,
        motorAjustar,
        motorDesligar,
        musicaLigar,
        musicaDesligar,
        torcidaLigar,
        torcidaDesligar,
        torcidaVibrar,
      }}
    >
      {children}
    </SoundCtx.Provider>
  );
}

export function useSound(): Ctx {
  return useContext(SoundCtx);
}
