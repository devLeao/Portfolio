"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { token } from "@/lib/theme";
import { avatarBus } from "@/lib/avatarBus";
import { CODIGO, CORES } from "@/lib/codigoDaTela";
import Xicara, { type EstadoXicara } from "@/components/hero/Xicara";
import Mao from "@/components/hero/Mao";

/**
 * O Leandro na mesa, montado com primitivas.
 *
 * Por que não Ready Player Me: o GLB tem 3–6MB e vem de host externo, no
 * caminho crítico do hero. Primitivas custam zero byte, dão a blusa roxa
 * exata, e usam o mesmo vocabulário de forma (`RoundedBox`) dos keycaps.
 *
 * ---------- COMPOSIÇÃO ----------
 * Tudo é montado em volta da origem porque a câmera do R3F olha para [0,0,0].
 * As medidas abaixo foram apertadas para a cena INTEIRA caber no quadro:
 * antes, monitor, mesa e cadeira encostavam nas bordas do canvas e apareciam
 * cortados, entregando a caixa do 3D.
 *
 * ---------- O QUE ELE RESPONDE ----------
 * scroll, mouse, CTA em foco, clique num CTA, tecla no teclado 3D, formulário
 * enviado, e alguém derrubando o café. Tudo pelo `avatarBus`.
 */

const PELE = "#7A5442";
const PELE_ESCURA = "#5E3F31";
const CABELO = "#17110F";
const TAMPO = "#1C1723";
const ESTRUTURA = "#15111B";
const MONITOR = "#0E0E13";

/** Altura da superfície da mesa. Tudo que pousa nela usa este valor. */
export const TAMPO_Y = -0.46;

type Estado = "trabalhando" | "confuso" | "negando" | "acenando";

/* ============================================================
   MONITOR
   ============================================================ */

/**
 * Textura da tela: código TypeScript de verdade, com realce de sintaxe,
 * rolando devagar.
 *
 * Antes eram barras cinza representando "linhas". Barra é barra — de perto o
 * olho reconhece o truque. Texto real custa o mesmo e vende a cena.
 */
function useTexturaCodigo() {
  return useMemo(() => {
    if (typeof document === "undefined") return null;

    const canvas = document.createElement("canvas");
    // Resolução alta o bastante para a fonte não virar mingau: a tela ocupa
    // pouco espaço na viewport, mas o zoom da câmera é generoso.
    canvas.width = 640;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const textura = new THREE.CanvasTexture(canvas);
    textura.colorSpace = THREE.SRGBColorSpace;
    textura.anisotropy = 4;

    const ALTURA_LINHA = 19;
    const total = CODIGO.length * ALTURA_LINHA;

    const desenhar = (deslocamento: number) => {
      ctx.fillStyle = "#0B0B12";
      ctx.fillRect(0, 0, 640, 400);

      // calha da esquerda, com números de linha
      ctx.fillStyle = "#0E0E17";
      ctx.fillRect(0, 0, 42, 400);

      ctx.font = "500 14px ui-monospace, 'Cascadia Mono', Consolas, monospace";
      ctx.textBaseline = "middle";

      CODIGO.forEach((linha, i) => {
        const y = ((i * ALTURA_LINHA - deslocamento) % total + total) % total - 30;
        if (y < -12 || y > 412) return;

        ctx.fillStyle = "#33384A";
        ctx.fillText(String(i + 1).padStart(2, " "), 8, y);

        let x = 52 + linha.ind * 16;
        for (const tok of linha.toks) {
          ctx.fillStyle = CORES[tok.c];
          ctx.fillText(tok.t, x, y);
          x += ctx.measureText(tok.t).width;
        }
      });

      textura.needsUpdate = true;
    };

    // Primeiro quadro já desenhado: com movimento reduzido o `useFrame` não
    // roda, e sem isto a tela apareceria apagada.
    desenhar(0);

    return { textura, desenhar, total };
  }, []);
}

function Monitor({ ativo }: { ativo: boolean }) {
  const codigo = useTexturaCodigo();
  const deslocamento = useRef(0);

  useFrame((_, delta) => {
    if (!ativo || !codigo) return;
    deslocamento.current = (deslocamento.current + delta * 11) % codigo.total;
    codigo.desenhar(deslocamento.current);
  });

  return (
    // À esquerda dele e girado para a câmera: é o giro que faz a tela existir.
    <group position={[-0.74, 0.06, 0.24]} rotation={[0, 0.56, 0]}>
      <RoundedBox args={[1.16, 0.75, 0.05]} radius={0.03} smoothness={3}>
        <meshStandardMaterial color={MONITOR} roughness={0.45} metalness={0.25} />
      </RoundedBox>

      <mesh position={[0, 0.012, 0.03]}>
        <planeGeometry args={[1.08, 0.66]} />
        {codigo ? (
          <meshBasicMaterial map={codigo.textura} toneMapped={false} />
        ) : (
          <meshBasicMaterial color="#0B0B12" />
        )}
      </mesh>

      <mesh position={[0, -0.47, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.22, 12]} />
        <meshStandardMaterial color={MONITOR} roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.575, 0.03]}>
        <cylinderGeometry args={[0.2, 0.22, 0.025, 20]} />
        <meshStandardMaterial color={MONITOR} roughness={0.5} />
      </mesh>
    </group>
  );
}

/* ============================================================
   MESA
   ============================================================ */

/** Teclado com teclas de verdade — uma placa lisa lia como bandeja. */
function TecladoDaMesa() {
  const teclas = useMemo(() => {
    const saida: [number, number][] = [];
    const cols = 13;
    const linhas = 4;
    const passo = 0.049;
    for (let l = 0; l < linhas; l += 1) {
      // Cada fileira é levemente deslocada, como num teclado real.
      const desloca = l * 0.012;
      for (let c = 0; c < cols; c += 1) {
        saida.push([
          (c - (cols - 1) / 2) * passo + desloca,
          (l - (linhas - 1) / 2) * passo,
        ]);
      }
    }
    return saida;
  }, []);

  return (
    <group position={[0.02, TAMPO_Y + 0.012, 0.6]} rotation={[0, -0.16, 0]}>
      {/* base */}
      <RoundedBox args={[0.72, 0.022, 0.24]} radius={0.008} smoothness={2}>
        <meshStandardMaterial color="#15111A" roughness={0.7} />
      </RoundedBox>

      {teclas.map(([x, z]) => (
        <RoundedBox
          key={`${x}-${z}`}
          args={[0.036, 0.012, 0.036]}
          radius={0.004}
          smoothness={2}
          position={[x, 0.016, z]}
        >
          <meshStandardMaterial color="#2A2432" roughness={0.55} />
        </RoundedBox>
      ))}

      {/* barra de espaço */}
      <RoundedBox
        args={[0.2, 0.012, 0.034]}
        radius={0.004}
        smoothness={2}
        position={[0.03, 0.016, 0.098]}
      >
        <meshStandardMaterial color="#2A2432" roughness={0.55} />
      </RoundedBox>
    </group>
  );
}

/** Mouse ao lado do teclado. Faltava, e a mesa parecia meio vazia. */
function MouseDaMesa() {
  return (
    <group position={[0.53, TAMPO_Y + 0.022, 0.62]} rotation={[0, -0.2, 0]}>
      <mesh scale={[1, 0.62, 1.5]}>
        <sphereGeometry args={[0.045, 20, 14]} />
        <meshStandardMaterial color="#221C2A" roughness={0.42} metalness={0.1} />
      </mesh>
      {/* linha divisória dos botões */}
      <mesh position={[0, 0.028, -0.03]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[0.002, 0.001, 0.035]} />
        <meshStandardMaterial color="#0D0A11" roughness={0.6} />
      </mesh>
      {/* mousepad, para o mouse não flutuar sobre a madeira */}
      <mesh position={[-0.02, -0.021, 0.01]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.26, 0.2]} />
        <meshStandardMaterial color="#171320" roughness={0.85} />
      </mesh>
    </group>
  );
}

function Mesa() {
  return (
    <group>
      {/* Tampo. Largura escolhida para as duas pontas ficarem DENTRO do
          quadro em 16:9 — encostando na borda, o corte reto entrega a caixa
          do 3D e a cena vira um retângulo colado na página. */}
      <RoundedBox
        args={[1.76, 0.06, 0.88]}
        radius={0.018}
        smoothness={2}
        position={[-0.08, TAMPO_Y - 0.03, 0.45]}
      >
        <meshStandardMaterial color={TAMPO} roughness={0.62} />
      </RoundedBox>

      {/* Saia da mesa: fecha o vão por onde antes se via o "nada" embaixo. */}
      <mesh position={[-0.08, TAMPO_Y - 0.16, 0.93]}>
        <boxGeometry args={[1.76, 0.22, 0.03]} />
        <meshStandardMaterial color="#15111C" roughness={0.8} />
      </mesh>

      <TecladoDaMesa />
      <MouseDaMesa />
    </group>
  );
}

/** Cadeira: encosto + apoio de braço. Antes só havia uma placa solta atrás. */
function Cadeira() {
  return (
    <group position={[0.12, 0, -0.5]} rotation={[0, -0.28, 0]}>
      <RoundedBox
        args={[0.7, 0.86, 0.1]}
        radius={0.12}
        smoothness={3}
        position={[0, -0.12, 0]}
        rotation={[0.09, 0, 0]}
      >
        <meshStandardMaterial color={ESTRUTURA} roughness={0.88} />
      </RoundedBox>

      {/* apoio de cabeça */}
      <RoundedBox
        args={[0.44, 0.2, 0.09]}
        radius={0.06}
        smoothness={3}
        position={[0, 0.38, 0.01]}
        rotation={[0.12, 0, 0]}
      >
        <meshStandardMaterial color={ESTRUTURA} roughness={0.88} />
      </RoundedBox>
    </group>
  );
}

/* ============================================================
   PESSOA
   ============================================================ */

function Pessoa({
  ativo,
  progresso,
  xicara,
}: {
  ativo: boolean;
  progresso: React.RefObject<number>;
  xicara: React.RefObject<EstadoXicara>;
}) {
  const corpo = useRef<THREE.Group>(null);
  const cabeca = useRef<THREE.Group>(null);
  const bracoE = useRef<THREE.Group>(null);
  const bracoD = useRef<THREE.Group>(null);
  const palpebras = useRef<THREE.Group>(null);
  const sobrancelhaE = useRef<THREE.Mesh>(null);
  const sobrancelhaD = useRef<THREE.Mesh>(null);
  const boca = useRef<THREE.Mesh>(null);

  const { gl } = useThree();
  const roxo = useMemo(() => token("--color-iris"), []);

  const tempo = useRef(0);
  const proximaPiscada = useRef(1.5 + Math.random() * 3);

  const estado = useRef<Estado>("trabalhando");
  const ate = useRef(0);
  const digitandoRapidoAte = useRef(0);
  const sorrindoAte = useRef(0);

  const arrasto = useRef(0);
  const arrastando = useRef(false);
  const xInicial = useRef(0);
  const arrastoInicial = useRef(0);

  /** Giro extra do TRONCO quando ele olha para algo bem lateral. */
  const assist = useRef(0);

  useEffect(() => {
    return avatarBus.ouvir((evento) => {
      const t = tempo.current;
      switch (evento.tipo) {
        case "confuso":
          estado.current = "confuso";
          ate.current = t + 1.2;
          break;
        case "acenar":
          if (estado.current === "trabalhando") {
            estado.current = "acenando";
            ate.current = t + 1.5;
          }
          break;
        case "digitar":
          digitandoRapidoAte.current = t + 1.1;
          break;
        case "sorrir":
          sorrindoAte.current = t + 2.5;
          break;
      }
    });
  }, []);

  const aoPegar = (e: ThreeEvent<PointerEvent>) => {
    if (!ativo) return;
    e.stopPropagation();
    arrastando.current = true;
    xInicial.current = e.nativeEvent.clientX;
    arrastoInicial.current = arrasto.current;
    gl.domElement.style.touchAction = "none";
  };

  useEffect(() => {
    const mover = (e: PointerEvent) => {
      if (!arrastando.current) return;
      const dx = (e.clientX - xInicial.current) / window.innerWidth;
      arrasto.current = THREE.MathUtils.clamp(arrastoInicial.current + dx * 3.2, -1.4, 1.4);
    };
    const soltar = () => {
      if (!arrastando.current) return;
      arrastando.current = false;
      gl.domElement.style.touchAction = "";
    };

    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
    window.addEventListener("pointercancel", soltar);
    return () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", soltar);
      window.removeEventListener("pointercancel", soltar);
    };
  }, [gl]);

  useFrame((_, delta) => {
    if (!ativo) return;
    tempo.current += delta;
    const t = tempo.current;

    if (t > ate.current) {
      if (estado.current === "confuso") {
        estado.current = "negando";
        ate.current = t + 1.35;
      } else if (estado.current !== "trabalhando") {
        estado.current = "trabalhando";
      }
    }

    const p = Math.min(Math.max(progresso.current, 0) / 0.16, 1);
    const virada = Math.sin(p * Math.PI);

    if (!arrastando.current && Math.abs(arrasto.current) > 0.001) {
      arrasto.current += (0 - arrasto.current) * 0.055;
    }

    const respiro = Math.sin(t * 1.35) * 0.011;

    // ---------- para onde a cabeça olha ----------
    let alvoY = 0;
    let alvoX = -0.05;
    let alvoZ = 0;
    let firmeza = 0.07;
    let assistAlvo = 0;

    if (estado.current === "negando") {
      alvoY = Math.sin((t - ate.current + 1.35) * 11) * 0.3;
      alvoX = -0.02;
      firmeza = 0.45;
    } else if (estado.current === "confuso" && xicara.current) {
      /*
       * Olhar para a xícara sem quebrar o pescoço.
       *
       * A versão anterior mandava a cabeça direto para o ângulo do alvo e o
       * resultado era um giro de mais de 60° com inclinação junto — pose que
       * pessoa nenhuma faz. Duas correções:
       *
       * 1. O TRONCO ajuda. Gente olha para o lado girando o tronco também; o
       *    pescoço sozinho não chega lá. `assist` leva 60% do trabalho.
       * 2. Teto duro no que sobra para o pescoço: ±0,55 rad (~32°) de giro,
       *    0,22 de inclinação para baixo e 0,12 de tombo lateral. Acima disso
       *    deixa de ser "olhando" e vira "deslocado".
       */
      const dx = xicara.current.x - 0.12;
      const dz = xicara.current.z - 0.12;
      const mundo = Math.atan2(dx, dz);
      const precisa = mundo - (corpo.current?.rotation.y ?? 0);

      assistAlvo = THREE.MathUtils.clamp(precisa * 0.6, -0.5, 0.5);
      alvoY = THREE.MathUtils.clamp(precisa - assistAlvo, -0.55, 0.55);
      alvoX = 0.22;
      alvoZ = 0.12;
      firmeza = 0.1;
    } else if (avatarBus.ctaAtivo) {
      alvoY = THREE.MathUtils.clamp(avatarBus.ctaPos.x * 0.6 - 0.1, -0.7, 0.55);
      alvoX = THREE.MathUtils.clamp(-avatarBus.ctaPos.y * 0.3, -0.25, 0.3);
      firmeza = 0.09;
    } else {
      alvoY = THREE.MathUtils.clamp(
        -0.06 + avatarBus.ponteiro.x * 0.5 + virada * 0.4,
        -0.7,
        0.7
      );
      alvoX = THREE.MathUtils.clamp(-0.05 - avatarBus.ponteiro.y * 0.2, -0.25, 0.28);
    }

    assist.current += (assistAlvo - assist.current) * 0.08;

    if (corpo.current) {
      corpo.current.rotation.y = THREE.MathUtils.lerp(
        corpo.current.rotation.y,
        -0.3 + virada * 0.3 + arrasto.current + assist.current,
        arrastando.current ? 0.35 : 0.07
      );
      corpo.current.position.y = -0.16 + respiro;
    }

    if (cabeca.current) {
      cabeca.current.rotation.y = THREE.MathUtils.lerp(cabeca.current.rotation.y, alvoY, firmeza);
      cabeca.current.rotation.x = THREE.MathUtils.lerp(
        cabeca.current.rotation.x,
        alvoX + Math.sin(t * 1.35 + 0.6) * 0.022,
        firmeza
      );
      cabeca.current.rotation.z = THREE.MathUtils.lerp(cabeca.current.rotation.z, alvoZ, 0.1);
    }

    const acenando = estado.current === "acenando";
    const parado = estado.current === "confuso" || estado.current === "negando";
    const digitando = parado ? 0 : 1 - virada;
    const ritmo = t < digitandoRapidoAte.current ? 17 : 9;

    if (bracoE.current) {
      bracoE.current.rotation.x = Math.sin(t * ritmo) * 0.08 * digitando;
    }

    if (bracoD.current) {
      if (acenando) {
        bracoD.current.rotation.x = THREE.MathUtils.lerp(bracoD.current.rotation.x, -1.5, 0.16);
        bracoD.current.rotation.z = Math.sin(t * 13) * 0.5;
      } else {
        bracoD.current.rotation.x = THREE.MathUtils.lerp(
          bracoD.current.rotation.x,
          Math.sin(t * ritmo + 1.8) * 0.08 * digitando,
          0.15
        );
        bracoD.current.rotation.z = THREE.MathUtils.lerp(bracoD.current.rotation.z, 0, 0.15);
      }
    }

    const alta = avatarBus.ctaAtivo ? 0.02 : 0;
    const confuso = estado.current === "confuso";
    if (sobrancelhaE.current) {
      sobrancelhaE.current.position.y = THREE.MathUtils.lerp(
        sobrancelhaE.current.position.y,
        0.078 + alta + (confuso ? 0.03 : 0),
        0.12
      );
    }
    if (sobrancelhaD.current) {
      sobrancelhaD.current.position.y = THREE.MathUtils.lerp(
        sobrancelhaD.current.position.y,
        0.078 + alta,
        0.12
      );
    }

    if (boca.current) {
      const alvo = parado ? 0.55 : t < sorrindoAte.current ? 1.45 : 1;
      boca.current.scale.x = THREE.MathUtils.lerp(boca.current.scale.x, alvo, 0.1);
      boca.current.scale.y = THREE.MathUtils.lerp(boca.current.scale.y, parado ? 0.5 : 1, 0.1);
    }

    if (palpebras.current) {
      const desde = t - proximaPiscada.current;
      if (desde > 0 && desde < 0.14) {
        palpebras.current.scale.y = 1;
      } else {
        palpebras.current.scale.y = 0.001;
        if (desde >= 0.14) proximaPiscada.current = t + 2.5 + Math.random() * 4;
      }
    }
  });

  return (
    <group ref={corpo} position={[0.12, -0.16, 0.1]} rotation={[0, -0.3, 0]}>
      {/*
       * ---------- TRONCO EM TRÊS PEÇAS ----------
       *
       * A versão anterior era UM `RoundedBox` de 1,02 de altura com raio 0,16.
       * Numa peça tão alta, o raio arredonda o topo e a base ao mesmo tempo e
       * o resultado é um tubo — uma peça de xadrez com cabeça em cima. Era a
       * deformação que aparecia na imagem.
       *
       * Corpo tem cintura. Três volumes resolvem:
       *   PEITO   largo em cima, curto, com raio pequeno
       *   CINTURA estreita, o degrau que cria a silhueta
       *   QUADRIL largo de novo, e some atrás da mesa
       *
       * Só o peito é a alça de arrasto: pegar na parte escondida pela mesa
       * seria pegar no que não se vê.
       */}
      <RoundedBox
        args={[0.5, 0.42, 0.34]}
        radius={0.09}
        smoothness={4}
        position={[0, 0.12, 0]}
        onPointerDown={aoPegar}
        onPointerOver={() => {
          if (ativo) gl.domElement.dataset.cursorGrow = "true";
        }}
        onPointerOut={() => {
          delete gl.domElement.dataset.cursorGrow;
        }}
      >
        <meshStandardMaterial color={roxo} roughness={0.78} />
      </RoundedBox>

      {/* cintura */}
      <RoundedBox args={[0.42, 0.26, 0.3]} radius={0.07} smoothness={3} position={[0, -0.16, 0]}>
        <meshStandardMaterial color={roxo} roughness={0.78} />
      </RoundedBox>

      {/* quadril, quase todo escondido pelo tampo */}
      <RoundedBox args={[0.52, 0.5, 0.36]} radius={0.1} smoothness={3} position={[0, -0.46, 0.02]}>
        <meshStandardMaterial color="#2A2036" roughness={0.85} />
      </RoundedBox>

      {/* Ombros como duas esferas nas pontas, não uma bola no meio: é o que
          dá largura em cima sem inflar o peito. */}
      <mesh position={[-0.24, 0.28, 0]} scale={[1, 0.85, 1]}>
        <sphereGeometry args={[0.115, 16, 12]} />
        <meshStandardMaterial color={roxo} roughness={0.78} />
      </mesh>
      <mesh position={[0.24, 0.28, 0]} scale={[1, 0.85, 1]}>
        <sphereGeometry args={[0.115, 16, 12]} />
        <meshStandardMaterial color={roxo} roughness={0.78} />
      </mesh>

      {/* gola */}
      <mesh position={[0, 0.32, 0.005]} scale={[1, 0.5, 0.9]}>
        <sphereGeometry args={[0.145, 16, 12]} />
        <meshStandardMaterial color={roxo} roughness={0.8} />
      </mesh>

      {/* pescoço — agora VISÍVEL entre a gola e o queixo */}
      <mesh position={[0, 0.42, 0.01]}>
        <cylinderGeometry args={[0.085, 0.105, 0.16, 16]} />
        <meshStandardMaterial color={PELE_ESCURA} roughness={0.8} />
      </mesh>

      {/* ---------- braços ----------
          O antebraço desce em diagonal até a altura do teclado e a mão fica
          apoiada, não pendurada. */}
      <group ref={bracoE} position={[-0.26, 0.22, 0.03]}>
        <mesh position={[-0.025, -0.24, 0.23]} rotation={[-0.76, 0, 0.1]}>
          <capsuleGeometry args={[0.072, 0.5, 4, 10]} />
          <meshStandardMaterial color={roxo} roughness={0.78} />
        </mesh>
        <group position={[-0.05, -0.445, 0.44]} rotation={[-0.1, 0, 0]}>
          <Mao lado={-1} pele={PELE} />
        </group>
      </group>

      <group ref={bracoD} position={[0.26, 0.22, 0.03]}>
        <mesh position={[0.025, -0.24, 0.23]} rotation={[-0.76, 0, -0.1]}>
          <capsuleGeometry args={[0.072, 0.5, 4, 10]} />
          <meshStandardMaterial color={roxo} roughness={0.78} />
        </mesh>
        <group position={[0.05, -0.445, 0.44]} rotation={[-0.1, 0, 0]}>
          <Mao lado={1} pele={PELE} />
        </group>
      </group>

      {/* ---------- cabeça ---------- */}
      <group ref={cabeca} position={[0, 0.68, 0]} rotation={[0, -0.06, 0]}>
        <mesh scale={[1, 1.06, 0.94]}>
          <sphereGeometry args={[0.25, 32, 24]} />
          <meshStandardMaterial color={PELE} roughness={0.7} />
        </mesh>

        <mesh position={[-0.24, -0.015, 0]} scale={[0.45, 1, 0.65]}>
          <sphereGeometry args={[0.062, 12, 10]} />
          <meshStandardMaterial color={PELE_ESCURA} roughness={0.82} />
        </mesh>
        <mesh position={[0.24, -0.015, 0]} scale={[0.45, 1, 0.65]}>
          <sphereGeometry args={[0.062, 12, 10]} />
          <meshStandardMaterial color={PELE_ESCURA} roughness={0.82} />
        </mesh>

        {/* Cabelo curto: calota rasa. Mais fundo que isso fecha a testa. */}
        <mesh position={[0, 0.033, -0.008]} scale={[1.03, 1, 1.02]}>
          <sphereGeometry args={[0.25, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.42]} />
          <meshStandardMaterial color={CABELO} roughness={0.95} />
        </mesh>

        <mesh position={[-0.085, 0.015, 0.226]}>
          <sphereGeometry args={[0.029, 16, 12]} />
          <meshStandardMaterial color="#0d0d10" roughness={0.2} />
        </mesh>
        <mesh position={[0.085, 0.015, 0.226]}>
          <sphereGeometry args={[0.029, 16, 12]} />
          <meshStandardMaterial color="#0d0d10" roughness={0.2} />
        </mesh>

        <group ref={palpebras} scale={[1, 0.001, 1]}>
          <mesh position={[-0.085, 0.022, 0.229]}>
            <sphereGeometry args={[0.033, 12, 8]} />
            <meshStandardMaterial color={PELE} roughness={0.7} />
          </mesh>
          <mesh position={[0.085, 0.022, 0.229]}>
            <sphereGeometry args={[0.033, 12, 8]} />
            <meshStandardMaterial color={PELE} roughness={0.7} />
          </mesh>
        </group>

        <mesh ref={boca} position={[0, -0.058, 0.214]} rotation={[0.2, 0, Math.PI]}>
          <torusGeometry args={[0.046, 0.0102, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#3B241C" roughness={0.75} />
        </mesh>

        <mesh ref={sobrancelhaE} position={[-0.085, 0.078, 0.218]} rotation={[0, 0, 0.12]}>
          <boxGeometry args={[0.07, 0.014, 0.018]} />
          <meshStandardMaterial color={CABELO} roughness={0.9} />
        </mesh>
        <mesh ref={sobrancelhaD} position={[0.085, 0.078, 0.218]} rotation={[0, 0, -0.12]}>
          <boxGeometry args={[0.07, 0.014, 0.018]} />
          <meshStandardMaterial color={CABELO} roughness={0.9} />
        </mesh>

        {/* fones: arco fino, conchas discretas */}
        <mesh position={[0, 0.043, -0.005]}>
          <torusGeometry args={[0.262, 0.018, 8, 24, Math.PI]} />
          <meshStandardMaterial color="#22222B" roughness={0.5} metalness={0.15} />
        </mesh>
        <mesh position={[-0.262, -0.005, 0]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.046, 0.028, 4, 10]} />
          <meshStandardMaterial color="#22222B" roughness={0.5} />
        </mesh>
        <mesh position={[0.262, -0.005, 0]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.046, 0.028, 4, 10]} />
          <meshStandardMaterial color="#22222B" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

/* ============================================================
   CENA
   ============================================================ */

export default function AvatarScene({
  ativo,
  progresso,
}: {
  ativo: boolean;
  progresso: React.RefObject<number>;
}) {
  const roxoClaro = useMemo(() => token("--color-iris-soft"), []);
  const xicara = useRef<EstadoXicara>({ x: 0.62, z: 0.66, derramou: false });

  return (
    <>
      {/* Orçamento de luz apertado: com tudo no padrão, o roxo da blusa lava
          e vira lilás de papel de parede. A cor tem que bater #8B5CF6. */}
      <directionalLight position={[3, 3.6, 2.6]} intensity={1.25} color="#DCE6FF" />
      <directionalLight position={[-3.2, 1.4, 1.6]} intensity={0.32} color="#9FB3D9" />
      <pointLight position={[-0.5, 1.5, -2.4]} intensity={7} color={roxoClaro} distance={7} />
      <ambientLight intensity={0.16} />

      {/* Environment local — o `preset` do drei baixa 1,5MB de HDR de host de
          terceiro. Ver a nota longa em KeyboardScene. */}
      <Environment resolution={128} frames={1} environmentIntensity={0.5}>
        <Lightformer
          form="rect"
          intensity={2.4}
          position={[1, 4, 3]}
          rotation={[-Math.PI / 3, 0, 0]}
          scale={[8, 5, 1]}
          color="#E8EEFF"
        />
        <Lightformer form="rect" intensity={1.6} position={[-1, 1.5, -4]} scale={[6, 4, 1]} color={roxoClaro} />
        <Lightformer form="rect" intensity={0.9} position={[-4, 1, 2]} scale={[3, 4, 1]} color="#9FB3D9" />
      </Environment>

      <Cadeira />
      <Mesa />
      <Monitor ativo={ativo} />
      <Xicara ativo={ativo} estado={xicara} />
      <Pessoa ativo={ativo} progresso={progresso} xicara={xicara} />

      <ContactShadows
        position={[-0.08, TAMPO_Y + 0.002, 0.45]}
        opacity={0.4}
        scale={3.2}
        blur={2.4}
        far={1.2}
        resolution={512}
        frames={ativo ? Infinity : 1}
      />
    </>
  );
}
