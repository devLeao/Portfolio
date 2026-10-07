"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  LARGURA_PISTA,
  VOLTAS,
  caminhoSvg,
  criarPista,
  faixa,
  muro,
  maisProximo,
  noPonto,
  type Pista,
} from "./pista";
import { CORES } from "./cores";

/**
 * Corrida noturna — a cena 3D.
 *
 * Este arquivo só é baixado quando alguém aperta "jogar": o wrapper o importa
 * com `next/dynamic`, e é aqui que o three entra. Nada disso pesa na página.
 *
 * ---------- o visual ----------
 * Renderizado a 60% da resolução e esticado com `image-rendering: pixelated`.
 * Não é só economia: é o que faz o 3D conversar com o resto do mundo pixel em
 * vez de parecer um jogo de outro site colado aqui.
 *
 * ---------- a física ----------
 * Arcade, sem engine. O carro é um ponto com rumo e velocidade; o volante
 * gira o rumo numa taxa que cresce com a velocidade (parado, não vira) e cai
 * um pouco no topo (a 200 por hora, a curva é mais larga). Fora do asfalto, o
 * teto de velocidade despenca — é a única "colisão" com a pista, e basta.
 *
 * ---------- os rivais ----------
 * Andam sobre a curva, não sobre física: cada um é uma distância ao longo da
 * pista e um desvio lateral que oscila devagar. A velocidade-alvo cai com a
 * curvatura LOGO À FRENTE, então eles tiram o pé antes do grampo — é o que
 * faz parecer que pilotam. Um elástico leve os mantém por perto do jogador
 * para a corrida não virar procissão.
 */

export type Controles = { gas: boolean; freio: boolean; esq: boolean; dir: boolean };

export type Hud = {
  volta: number;
  posicao: number;
  tempo: number;
  kmh: number;
  /** Segundos que faltam para a largada; 0 = acabou de largar; null = correndo. */
  contagem: number | null;
  /** Posições x,z de todos os carros, jogador primeiro — para o minimapa. */
  carros: number[];
};

export type Resultado = { posicao: number; tempo: number; melhorVolta: number };

export type Som = {
  tocar: (som: "acerto" | "batida" | "vitoria" | "derrota" | "virar") => void;
  motorLigar: () => void;
  motorAjustar: (v: number) => void;
  motorDesligar: () => void;
};

type Props = {
  controles: React.RefObject<Controles>;
  rodada: number;
  ativo: boolean;
  som: Som;
  onHud: (h: Hud) => void;
  onFim: (r: Resultado) => void;
  onMapa: (m: { d: string; viewBox: string }) => void;
};



export default function CorridaCena(props: Props) {
  const pista = useMemo(criarPista, []);

  return (
    <Canvas
      dpr={0.6}
      frameloop={props.ativo ? "always" : "never"}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      camera={{ fov: 62, near: 1, far: 900, position: [0, 6, 10] }}
      style={{ imageRendering: "pixelated" }}
    >
      <Cenario pista={pista} />
      <Jogo key={props.rodada} pista={pista} {...props} />
    </Canvas>
  );
}

/* ============================================================
   CENÁRIO — tudo estático, montado uma vez
   ============================================================ */

function textura(lado: number, pintar: (c: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const tela = document.createElement("canvas");
  tela.width = tela.height = lado;
  pintar(tela.getContext("2d")!);
  const t = new THREE.CanvasTexture(tela);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Pseudoaleatório com semente: o cenário é o mesmo a cada visita. */
function semente(n: number) {
  let s = n;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function Cenario({ pista }: { pista: Pista }) {
  const { scene } = useThree();

  const t = useMemo(() => {
    const asfalto = textura(32, (c) => {
      c.fillStyle = "#3a3150";
      c.fillRect(0, 0, 32, 32);
      const r = semente(7);
      for (let k = 0; k < 90; k++) {
        c.fillStyle = r() > 0.5 ? "#433a5c" : "#322a46";
        c.fillRect(Math.floor(r() * 32), Math.floor(r() * 32), 1, 1);
      }
      c.fillStyle = "#e9e4f5";
      c.fillRect(1, 0, 1, 32);
      c.fillRect(30, 0, 1, 32);
      c.fillStyle = "#fbbf24";
      c.fillRect(15, 0, 2, 14);
    });
    const zebra = textura(4, (c) => {
      c.fillStyle = "#f472b6";
      c.fillRect(0, 0, 4, 2);
      c.fillStyle = "#f5f1ea";
      c.fillRect(0, 2, 4, 2);
    });
    const xadrez = textura(8, (c) => {
      for (let y = 0; y < 8; y++)
        for (let x = 0; x < 8; x++) {
          c.fillStyle = (x + y) % 2 ? "#0a0808" : "#f5f1ea";
          c.fillRect(x, y, 1, 1);
        }
    });
    xadrez.repeat.set(2, 0.5);
    return { asfalto, zebra, xadrez };
  }, []);

  const geo = useMemo(() => {
    const m = LARGURA_PISTA / 2;
    return {
      pista: faixa(pista, -m, m, 10),
      zebraE: faixa(pista, m, m + 1.6, 3),
      zebraD: faixa(pista, -m - 1.6, -m, 3),
      // O muro aparece: muro invisível parece bug, não regra.
      muroE: muro(pista, LIMITE_MURO + 0.6, 0, 1.1),
      muroD: muro(pista, -LIMITE_MURO - 0.6, 0, 1.1),
      neonE: muro(pista, LIMITE_MURO + 0.6, 1.1, 1.35),
      neonD: muro(pista, -LIMITE_MURO - 0.6, 1.1, 1.35),
    };
  }, [pista]);

  /* Árvores e postes: longe o bastante do asfalto para nunca nascer em cima. */
  const { arvores, postes } = useMemo(() => {
    const r = semente(42);
    const arvores: { x: number; z: number; s: number }[] = [];
    const { minX, maxX, minZ, maxZ } = pista.limites;
    let tentativas = 0;
    while (arvores.length < 220 && tentativas < 4000) {
      tentativas++;
      const x = minX - 80 + r() * (maxX - minX + 160);
      const z = minZ - 80 + r() * (maxZ - minZ + 160);
      const i = maisProximo(pista, x, z, -1);
      const d = Math.hypot(x - pista.pos[i * 2]!, z - pista.pos[i * 2 + 1]!);
      if (d < LIMITE_MURO + 3) continue;
      arvores.push({ x, z, s: 0.8 + r() * 0.9 });
    }
    const postes: { x: number; z: number; cor: string }[] = [];
    for (let i = 0; i < pista.n; i += 32) {
      for (const lado of [1, -1]) {
        const d = (LARGURA_PISTA / 2 + 3.5) * lado;
        postes.push({
          x: pista.pos[i * 2]! + pista.nor[i * 2]! * d,
          z: pista.pos[i * 2 + 1]! + pista.nor[i * 2 + 1]! * d,
          cor: lado > 0 ? "#f472b6" : "#60a5fa",
        });
      }
    }
    return { arvores, postes };
  }, [pista]);

  const copas = useRef<THREE.InstancedMesh>(null);
  const troncos = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const m = new THREE.Matrix4();
    arvores.forEach((a, k) => {
      m.makeScale(a.s, a.s, a.s).setPosition(a.x, 3.2 * a.s, a.z);
      copas.current?.setMatrixAt(k, m);
      m.makeScale(a.s, a.s, a.s).setPosition(a.x, 0.9 * a.s, a.z);
      troncos.current?.setMatrixAt(k, m);
    });
    if (copas.current) copas.current.instanceMatrix.needsUpdate = true;
    if (troncos.current) troncos.current.instanceMatrix.needsUpdate = true;
  }, [arvores]);

  const estrelas = useMemo(() => {
    const r = semente(3);
    const v = new Float32Array(500 * 3);
    for (let k = 0; k < 500; k++) {
      const a = r() * Math.PI * 2;
      const e = 0.08 + r() * 0.9;
      v.set([Math.cos(a) * Math.cos(e) * 700, Math.sin(e) * 700, Math.sin(a) * Math.cos(e) * 700], k * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(v, 3));
    return g;
  }, []);

  const montanhas = useMemo(() => {
    const r = semente(11);
    return Array.from({ length: 26 }, (_, k) => {
      const a = (k / 26) * Math.PI * 2 + r() * 0.2;
      return { x: Math.cos(a) * 520, z: Math.sin(a) * 520 - 90, h: 60 + r() * 90, l: 70 + r() * 60 };
    });
  }, []);

  useEffect(() => {
    scene.background = new THREE.Color("#1a0b2e");
    scene.fog = new THREE.Fog("#1a0b2e", 70, 330);
    return () => {
      scene.background = null;
      scene.fog = null;
    };
  }, [scene]);

  const largada = noPonto(pista, 0);
  const rumoLargada = Math.atan2(largada.tx, largada.tz);

  return (
    <>
      <hemisphereLight args={["#a78bfa", "#0a0808", 1.3]} />
      <directionalLight position={[-120, 160, 60]} intensity={1.1} color="#f9e2ff" />

      {/* chão + grade de néon */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.15, -90]}>
        <planeGeometry args={[2000, 2000]} />
        <meshLambertMaterial color="#0f0a1c" />
      </mesh>
      <gridHelper args={[1600, 80, "#3b1e5e", "#2d1b4e"]} position={[0, -0.1, -90]} />

      <mesh geometry={geo.pista} position-y={0.05}>
        {/* Sem luz: à noite, o asfalto iluminado sumia no chão. */}
        <meshBasicMaterial map={t.asfalto} />
      </mesh>
      <mesh geometry={geo.zebraE} position-y={0.08}>
        <meshLambertMaterial map={t.zebra} />
      </mesh>
      <mesh geometry={geo.zebraD} position-y={0.08}>
        <meshLambertMaterial map={t.zebra} />
      </mesh>
      {[geo.muroE, geo.muroD].map((g, k) => (
        <mesh key={k} geometry={g}>
          <meshLambertMaterial color="#2d1b4e" side={THREE.DoubleSide} />
        </mesh>
      ))}
      {[geo.neonE, geo.neonD].map((g, k) => (
        <mesh key={k} geometry={g}>
          <meshBasicMaterial color={k ? "#60a5fa" : "#f472b6"} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* largada: faixa quadriculada e o pórtico */}
      <group position={[largada.x, 0, largada.z]} rotation-y={rumoLargada}>
        <mesh rotation-x={-Math.PI / 2} position-y={0.12}>
          <planeGeometry args={[LARGURA_PISTA, 3]} />
          <meshBasicMaterial map={t.xadrez} />
        </mesh>
        {[-1, 1].map((l) => (
          <mesh key={l} position={[l * (LARGURA_PISTA / 2 + 1.2), 4, 0]}>
            <boxGeometry args={[0.8, 8, 0.8]} />
            <meshLambertMaterial color="#2d1b4e" />
          </mesh>
        ))}
        <mesh position={[0, 8.4, 0]}>
          <boxGeometry args={[LARGURA_PISTA + 3.2, 1.2, 0.8]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
      </group>

      {/* árvores: duas malhas instanciadas, 220 árvores, duas chamadas de desenho */}
      <instancedMesh ref={copas} args={[undefined, undefined, arvores.length]}>
        <coneGeometry args={[2.2, 5, 5]} />
        <meshLambertMaterial color="#2f6b4f" flatShading />
      </instancedMesh>
      <instancedMesh ref={troncos} args={[undefined, undefined, arvores.length]}>
        <cylinderGeometry args={[0.35, 0.45, 1.8, 5]} />
        <meshLambertMaterial color="#3b2a20" />
      </instancedMesh>

      {postes.map((p, k) => (
        <group key={k} position={[p.x, 0, p.z]}>
          <mesh position-y={2.5}>
            <boxGeometry args={[0.3, 5, 0.3]} />
            <meshLambertMaterial color="#241c2e" />
          </mesh>
          <mesh position-y={5.2}>
            <boxGeometry args={[0.8, 0.5, 0.8]} />
            <meshBasicMaterial color={p.cor} />
          </mesh>
        </group>
      ))}

      {montanhas.map((m, k) => (
        <mesh key={k} position={[m.x, m.h / 2 - 2, m.z]}>
          <coneGeometry args={[m.l, m.h, 4]} />
          <meshBasicMaterial color="#2d1b4e" fog={false} />
        </mesh>
      ))}

      <points geometry={estrelas}>
        <pointsMaterial color="#f5f1ea" size={2} sizeAttenuation={false} fog={false} />
      </points>
      <mesh position={[-260, 230, -520]}>
        <sphereGeometry args={[26, 12, 8]} />
        <meshBasicMaterial color="#fbbf24" fog={false} />
      </mesh>
    </>
  );
}

/* ============================================================
   CARRO
   ============================================================ */

function Carro({ cor, ref }: { cor: string; ref: React.Ref<THREE.Group> }) {
  return (
    <group ref={ref}>
      {/* grupo interno: é ele que inclina na curva, não o carro inteiro */}
      <group name="carroceria">
        <mesh position={[0, 0.62, 0]}>
          <boxGeometry args={[2.1, 0.55, 4.3]} />
          <meshLambertMaterial color={cor} flatShading />
        </mesh>
        <mesh position={[0, 1.1, -0.35]}>
          <boxGeometry args={[1.7, 0.5, 2]} />
          <meshLambertMaterial color="#1a1426" />
        </mesh>
        <mesh position={[0, 1.15, -2.05]}>
          <boxGeometry args={[2.1, 0.12, 0.45]} />
          <meshLambertMaterial color={cor} />
        </mesh>
        {[-0.6, 0.6].map((x) => (
          <mesh key={`f${x}`} position={[x, 0.66, 2.16]}>
            <boxGeometry args={[0.5, 0.18, 0.05]} />
            <meshBasicMaterial color="#fff3c4" />
          </mesh>
        ))}
        {[-0.65, 0.65].map((x) => (
          <mesh key={`t${x}`} position={[x, 0.7, -2.16]}>
            <boxGeometry args={[0.5, 0.16, 0.05]} />
            <meshBasicMaterial color="#ff2a6d" />
          </mesh>
        ))}
      </group>
      {[
        [-1.05, 1.35],
        [1.05, 1.35],
        [-1.05, -1.35],
        [1.05, -1.35],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x!, 0.42, z!]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.42, 0.42, 0.35, 8]} />
          <meshLambertMaterial color="#0b0b0f" />
        </mesh>
      ))}
    </group>
  );
}

/* ============================================================
   JOGO — simulação, câmera e HUD
   ============================================================ */

const VMAX = 52;
const VMAX_GRAMA = 20;
const ACEL = 26;
const FREIO = 50;
const RE = -12;
const GIRO = 2.3;
const LIMITE_GRAMA = LARGURA_PISTA / 2 + 0.8;
const LIMITE_MURO = LARGURA_PISTA / 2 + 10;
const CONTAGEM = 3;
/** Raio de colisão entre carros, somado. */
const COLISAO = 3.6;

type Rival = { s: number; v: number; faixa: number; fase: number; habilidade: number; idx: number };

function Jogo({
  pista,
  controles,
  ativo,
  som,
  onHud,
  onFim,
  onMapa,
}: Props & { pista: Pista }) {
  const { camera } = useThree();
  const L = pista.comprimento;
  const passo = L / pista.n;

  const eu = useRef<THREE.Group>(null);
  const r0 = useRef<THREE.Group>(null);
  const r1 = useRef<THREE.Group>(null);
  const r2 = useRef<THREE.Group>(null);
  const grupos = [r0, r1, r2];

  /* Grid de largada: o jogador sai em último, à direita. Ultrapassar é o jogo. */
  const estado = useRef(
    (() => {
      const p = noPonto(pista, -22);
      const lat = -3.5;
      const idx = maisProximo(pista, p.x + p.nx * lat, p.z + p.nz * lat, -1);
      return {
        x: p.x + p.nx * lat,
        z: p.z + p.nz * lat,
        rumo: Math.atan2(p.tx, p.tz),
        v: 0,
        inclina: 0,
        idx,
        voltas: -1,
        checkpoint: true,
        contagem: CONTAGEM,
        tempo: 0,
        inicioVolta: 0,
        melhorVolta: Infinity,
        terminou: false,
        hudAcc: 0,
        batidaAte: 0,
        ultimoBip: CONTAGEM + 1,
        rivais: [
          { s: -12, v: 0, faixa: -3.5, fase: 0.3, habilidade: 0.93, idx: 0 },
          { s: -12, v: 0, faixa: 3.5, fase: 2.1, habilidade: 0.88, idx: 0 },
          { s: -22, v: 0, faixa: 3.5, fase: 4.0, habilidade: 0.83, idx: 0 },
        ] as Rival[],
      };
    })()
  );

  useEffect(() => {
    const { minX, maxX, minZ, maxZ } = pista.limites;
    const m = 14;
    onMapa({
      d: caminhoSvg(pista),
      viewBox: `${minX - m} ${minZ - m} ${maxX - minX + m * 2} ${maxZ - minZ + m * 2}`,
    });
    // Câmera nasce já atrás do carro: sem isso, o primeiro quadro é um voo.
    const e = estado.current;
    camera.position.set(e.x - Math.sin(e.rumo) * 10, 4.5, e.z - Math.cos(e.rumo) * 10);
    camera.lookAt(e.x, 1, e.z);
  }, [pista, camera, onMapa]);

  // Motor liga com a cena e desliga com ela — inclusive quando a seção sai da
  // tela e o laço para.
  useEffect(() => {
    if (!ativo || estado.current.terminou) return;
    som.motorLigar();
    return () => som.motorDesligar();
  }, [ativo, som]);

  const posRival = (r: Rival, t: number) => {
    const p = noPonto(pista, r.s);
    const lat = Math.max(-4.5, Math.min(4.5, r.faixa + Math.sin(t * 0.35 + r.fase) * 1.6));
    return { x: p.x + p.nx * lat, z: p.z + p.nz * lat, rumo: Math.atan2(p.tx, p.tz), i: p.i };
  };

  const progresso = () => {
    const e = estado.current;
    return e.voltas * L + e.idx * passo;
  };

  useFrame((_, delta) => {
    const e = estado.current;
    const dt = Math.min(delta, 1 / 20);
    const c = controles.current;

    /* ---------- largada ---------- */
    if (e.contagem > 0) {
      e.contagem -= dt;
      const seg = Math.ceil(e.contagem);
      if (seg < e.ultimoBip && seg > 0) {
        e.ultimoBip = seg;
        som.tocar("acerto");
      }
      if (e.contagem <= 0) som.tocar("virar");
    } else if (!e.terminou) {
      e.tempo += dt;
    }
    const correndo = e.contagem <= 0;

    /* ---------- jogador ---------- */
    const pilotando = correndo && !e.terminou;
    const gas = pilotando && c.gas;
    const freio = pilotando && c.freio;
    const volante = pilotando ? (c.esq ? 1 : 0) - (c.dir ? 1 : 0) : 0;

    const pp = maisProximo(pista, e.x, e.z, e.idx);
    const lateral =
      (e.x - pista.pos[pp * 2]!) * pista.nor[pp * 2]! + (e.z - pista.pos[pp * 2 + 1]!) * pista.nor[pp * 2 + 1]!;
    const naGrama = Math.abs(lateral) > LIMITE_GRAMA;
    const teto = naGrama ? VMAX_GRAMA : VMAX;

    if (gas) e.v += ACEL * dt * (1 - Math.max(0, e.v) / (teto * 1.05));
    else if (freio) e.v -= (e.v > 0 ? FREIO : 14) * dt;
    else e.v -= e.v * 0.45 * dt;
    if (e.terminou) e.v -= e.v * 1.4 * dt;
    if (naGrama && e.v > VMAX_GRAMA) e.v -= (e.v - VMAX_GRAMA) * 2.4 * dt;
    e.v = Math.max(RE, Math.min(VMAX, e.v));

    const aderencia = Math.min(1, Math.abs(e.v) / 14) * (1 - 0.35 * (Math.abs(e.v) / VMAX));
    e.rumo += volante * GIRO * aderencia * Math.sign(e.v || 1) * dt;
    e.x += Math.sin(e.rumo) * e.v * dt;
    e.z += Math.cos(e.rumo) * e.v * dt;

    // Muro na beira da grama: atalho custa caro, mas fugir do mapa não existe.
    //
    // O carro RASPA no muro, não para nele. A primeira versão cortava a
    // velocidade a cada quadro de contato — e como o carro seguia apontando
    // para fora, ficava preso a 5 km/h com o pé no fundo. Agora o rumo é
    // jogado para a direção do muro e a perda de velocidade é uma só por batida.
    if (Math.abs(lateral) > LIMITE_MURO) {
      const lado = Math.sign(lateral);
      const volta = Math.abs(lateral) - LIMITE_MURO;
      e.x -= pista.nor[pp * 2]! * lado * volta;
      e.z -= pista.nor[pp * 2 + 1]! * lado * volta;
      const tx = pista.tan[pp * 2]!;
      const tz = pista.tan[pp * 2 + 1]!;
      const frente = Math.sin(e.rumo) * tx + Math.cos(e.rumo) * tz >= 0 ? 1 : -1;
      // Rumo paralelo ao muro, com um toque de volta para dentro.
      e.rumo = Math.atan2(tx * frente, tz * frente) - lado * frente * 0.08;
      if (e.tempo > e.batidaAte) {
        e.v *= 0.7;
        som.tocar("batida");
        e.batidaAte = e.tempo + 0.5;
      }
    }

    /* ---------- voltas ---------- */
    const antes = e.idx;
    e.idx = maisProximo(pista, e.x, e.z, e.idx);
    const N = pista.n;
    if (e.idx > N * 0.45 && e.idx < N * 0.55) e.checkpoint = true;
    if (antes > N * 0.75 && e.idx < N * 0.25 && e.checkpoint) {
      e.voltas += 1;
      e.checkpoint = false;
      if (e.voltas >= 1) e.melhorVolta = Math.min(e.melhorVolta, e.tempo - e.inicioVolta);
      e.inicioVolta = e.tempo;
      if (e.voltas >= VOLTAS && !e.terminou) {
        e.terminou = true;
        const posicao = 1 + e.rivais.filter((r) => r.s >= VOLTAS * L).length;
        som.motorDesligar();
        som.tocar(posicao === 1 ? "vitoria" : "derrota");
        onFim({ posicao, tempo: e.tempo, melhorVolta: e.melhorVolta });
      }
    } else if (antes < N * 0.25 && e.idx > N * 0.75) {
      // De ré pela linha: devolve a volta, senão vai e volta vira trapaça.
      e.voltas -= 1;
      e.checkpoint = true;
    }

    /* ---------- rivais ---------- */
    const meu = progresso();
    e.rivais.forEach((r, k) => {
      if (correndo) {
        const i = Math.floor((((r.s % L) + L) % L) / passo) % N;
        const freiaCurva = Math.min(0.5, Math.max(0, (pista.curva[i]! - 0.008) * 12));
        // Elástico: quem está muito na frente alivia, quem ficou para trás aperta.
        const gap = r.s - meu;
        const elastico = gap > 80 ? 0.94 : gap < -60 ? 1.06 : 1;
        const alvo = VMAX * r.habilidade * (1 - freiaCurva) * elastico;
        r.v += Math.sign(alvo - r.v) * Math.min(Math.abs(alvo - r.v), (r.v < alvo ? ACEL * 0.9 : FREIO) * dt);
        r.s += r.v * dt;
      }
      const p = posRival(r, e.tempo);
      r.idx = p.i;

      // Batida jogador × rival. O rival está "no trilho", então quem é
      // empurrado é o jogador — e os dois perdem velocidade.
      const dx = e.x - p.x;
      const dz = e.z - p.z;
      const d = Math.hypot(dx, dz);
      if (d < COLISAO && d > 0.001) {
        const empurra = COLISAO - d;
        e.x += (dx / d) * empurra;
        e.z += (dz / d) * empurra;
        e.v *= 0.86;
        r.v *= 0.92;
        if (e.tempo > e.batidaAte) {
          som.tocar("batida");
          e.batidaAte = e.tempo + 0.4;
        }
      }

      const g = grupos[k]!.current;
      if (g) {
        g.position.set(p.x, 0, p.z);
        g.rotation.y = p.rumo;
      }
    });

    /* ---------- desenho ---------- */
    const g = eu.current;
    if (g) {
      g.position.set(e.x, 0, e.z);
      g.rotation.y = e.rumo;
      e.inclina += (volante * Math.min(1, Math.abs(e.v) / VMAX) * 0.09 - e.inclina) * Math.min(1, dt * 8);
      const carroceria = g.getObjectByName("carroceria");
      if (carroceria) carroceria.rotation.z = -e.inclina;
    }

    // Câmera de perseguição, amortecida. O FOV abre com a velocidade: é a
    // forma mais barata de vender "rápido".
    const sx = Math.sin(e.rumo);
    const sz = Math.cos(e.rumo);
    const k = 1 - Math.exp(-8 * dt);
    camera.position.x += (e.x - sx * 9 - camera.position.x) * k;
    camera.position.y += (4.5 - camera.position.y) * k;
    camera.position.z += (e.z - sz * 9 - camera.position.z) * k;
    camera.lookAt(e.x + sx * 6, 1.2, e.z + sz * 6);
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = 60 + 12 * Math.min(1, Math.abs(e.v) / VMAX);
    cam.updateProjectionMatrix();

    if (!e.terminou) som.motorAjustar(Math.min(1, Math.abs(e.v) / VMAX));

    /* ---------- HUD, a 10 quadros por segundo ---------- */
    e.hudAcc += dt;
    if (e.hudAcc >= 0.1) {
      e.hudAcc = 0;
      const posicao = 1 + e.rivais.filter((r) => r.s > meu).length;
      const carros = [e.x, e.z];
      e.rivais.forEach((r) => {
        const p = posRival(r, e.tempo);
        carros.push(p.x, p.z);
      });
      onHud({
        volta: Math.max(1, Math.min(VOLTAS, e.voltas + 1)),
        posicao,
        tempo: e.tempo,
        kmh: Math.round(Math.abs(e.v) * 4.2),
        contagem: e.contagem > 0 ? Math.ceil(e.contagem) : e.tempo < 0.8 ? 0 : null,
        carros,
      });
    }
  });

  return (
    <>
      <Carro ref={eu} cor={CORES[0]!} />
      <Carro ref={r0} cor={CORES[1]!} />
      <Carro ref={r1} cor={CORES[2]!} />
      <Carro ref={r2} cor={CORES[3]!} />
    </>
  );
}
