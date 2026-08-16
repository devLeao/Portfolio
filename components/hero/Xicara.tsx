"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { avatarBus } from "@/lib/avatarBus";

/**
 * A xícara de café — a peça brincável da cena.
 *
 * Dá para pegar e arrastar pela mesa. Se for arrastada com pressa, ou se for
 * pega pela BORDA em vez da base, o café derrama: a inclinação depende tanto
 * da velocidade quanto da altura em que a mão pegou. Quem arrasta devagar
 * segurando embaixo consegue mover sem derrubar nada; quem sai puxando pelo
 * topo, não.
 *
 * Derramar avisa o avatar (`confuso`), que para de digitar, olha para a
 * bagunça, nega com a cabeça e volta ao trabalho.
 *
 * A poça seca sozinha depois de alguns segundos e a xícara enche de novo —
 * senão a brincadeira só funciona uma vez por visita.
 */

export type EstadoXicara = {
  /** Posição atual no tampo, em coordenadas de mundo. */
  x: number;
  z: number;
  derramou: boolean;
};

/** Centro da xícara em repouso. Ela tem 0,16 de altura sobre um tampo a -0,46. */
const CASA = { x: 0.62, z: 0.66 };
const ALTURA_TAMPO = -0.38;
/** Superfície da mesa — onde a poça se espalha. */
const SUPERFICIE = -0.455;
/** Limites do tampo onde a xícara pode andar sem atravessar pessoa ou monitor. */
const LIMITE = { xMin: -0.3, xMax: 0.92, zMin: 0.25, zMax: 0.88 };
/** Acima desta inclinação o café não fica mais dentro. */
const LIMIAR_DERRAME = 0.42;

const COR_LOUCA = "#E8E2D8";
/** Louça por dentro é mais escura: é a sombra da parede interna. */
const COR_LOUCA_DENTRO = "#9A948C";
const COR_CAFE = "#2A1810";

type Gota = { x: number; y: number; z: number; vx: number; vy: number; vz: number };

export default function Xicara({
  ativo,
  estado,
}: {
  ativo: boolean;
  estado: React.RefObject<EstadoXicara>;
}) {
  const grupo = useRef<THREE.Group>(null);
  const cafe = useRef<THREE.Mesh>(null);
  const poca = useRef<THREE.Group>(null);
  const gotasRef = useRef<THREE.InstancedMesh>(null);

  const { camera, gl } = useThree();

  const arrastando = useRef(false);
  /** 0 = pegou pela base, 1 = pegou pela borda de cima. */
  const alturaPegada = useRef(0);
  const posicao = useRef({ x: CASA.x, z: CASA.z });
  const anterior = useRef({ x: CASA.x, z: CASA.z });
  const velocidade = useRef({ x: 0, z: 0 });
  const inclinacao = useRef({ x: 0, z: 0 });

  const temCafe = useRef(true);
  /** Onde a poça nasceu. Ela é da MESA, não da xícara: fica onde sujou. */
  const pocaPos = useRef({ x: CASA.x, z: CASA.z });
  const secaEm = useRef(0);
  const tempo = useRef(0);
  const gotas = useRef<Gota[]>([]);
  const gotasAte = useRef(0);

  const plano = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 1, 0), -ALTURA_TAMPO),
    []
  );
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const ndc = useMemo(() => new THREE.Vector2(), []);
  const alvo = useMemo(() => new THREE.Vector3(), []);
  const matriz = useMemo(() => new THREE.Matrix4(), []);

  /** Converte um evento de ponteiro em ponto no tampo da mesa. */
  const pontoNoTampo = useCallback(
    (clientX: number, clientY: number) => {
      const r = gl.domElement.getBoundingClientRect();
      ndc.x = ((clientX - r.left) / r.width) * 2 - 1;
      ndc.y = -((clientY - r.top) / r.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      return raycaster.ray.intersectPlane(plano, alvo);
    },
    [camera, gl, ndc, raycaster, plano, alvo]
  );

  const derramar = useCallback(() => {
    if (!temCafe.current) return;
    temCafe.current = false;
    secaEm.current = tempo.current + 7;
    pocaPos.current.x = posicao.current.x;
    pocaPos.current.z = posicao.current.z;

    // Cinco gotas com velocidade inicial sorteada, na direção do movimento —
    // café derramado sai para onde a xícara estava indo.
    gotas.current = Array.from({ length: 5 }, () => ({
      x: posicao.current.x,
      y: ALTURA_TAMPO + 0.1,
      z: posicao.current.z,
      vx: velocidade.current.x * 0.4 + (Math.random() - 0.5) * 0.6,
      vy: 0.3 + Math.random() * 0.4,
      vz: velocidade.current.z * 0.4 + (Math.random() - 0.5) * 0.6,
    }));
    gotasAte.current = tempo.current + 1;

    // Guarda ONDE sujou: é para lá que o avatar vai olhar.
    if (estado.current) {
      estado.current.x = posicao.current.x;
      estado.current.z = posicao.current.z;
      estado.current.derramou = true;
    }

    avatarBus.emitir({ tipo: "confuso" });
  }, [estado]);

  const aoPegar = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!ativo) return;
      e.stopPropagation();
      arrastando.current = true;

      // A altura da pegada é o que decide se dá para carregar com segurança.
      // Base da xícara em -0.48, topo em -0.32.
      alturaPegada.current = THREE.MathUtils.clamp(
        (e.point.y - (ALTURA_TAMPO - 0.08)) / 0.16,
        0,
        1
      );
      // Sinaliza que está na mão: o cursor muda e o café balança na hora.
      gl.domElement.dataset.cursorGrow = "true";

      gl.domElement.style.touchAction = "none";
      (e.target as Element | null)?.setPointerCapture?.(e.pointerId);
    },
    [ativo, gl]
  );

  /* Arrastar continua valendo mesmo com o ponteiro fora da xícara, então os
     ouvintes vivem na janela, não na malha. */
  useEffect(() => {
    const mover = (e: PointerEvent) => {
      if (!arrastando.current) return;
      const p = pontoNoTampo(e.clientX, e.clientY);
      if (!p) return;

      posicao.current.x = THREE.MathUtils.clamp(p.x, LIMITE.xMin, LIMITE.xMax);
      posicao.current.z = THREE.MathUtils.clamp(p.z, LIMITE.zMin, LIMITE.zMax);
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
  }, [pontoNoTampo, gl]);

  useFrame((_, delta) => {
    if (!ativo) return;
    const dt = Math.min(delta, 0.05);
    tempo.current += dt;

    const g = grupo.current;
    if (!g) return;

    // ---------- velocidade ----------
    velocidade.current.x = (posicao.current.x - anterior.current.x) / dt;
    velocidade.current.z = (posicao.current.z - anterior.current.z) / dt;
    anterior.current.x = posicao.current.x;
    anterior.current.z = posicao.current.z;

    g.position.x = posicao.current.x;
    g.position.z = posicao.current.z;

    // ---------- inclinação ----------
    // Pegada alta multiplica o efeito: segurar pela borda é o jeito errado.
    const alavanca = 0.06 + alturaPegada.current * 0.16;
    const alvoZ = arrastando.current
      ? THREE.MathUtils.clamp(-velocidade.current.x * alavanca, -0.9, 0.9)
      : 0;
    const alvoX = arrastando.current
      ? THREE.MathUtils.clamp(velocidade.current.z * alavanca, -0.9, 0.9)
      : 0;

    // Subida rápida, volta lenta: a xícara balança e se acalma.
    const taxa = arrastando.current ? 0.22 : 0.09;
    inclinacao.current.z += (alvoZ - inclinacao.current.z) * taxa;
    inclinacao.current.x += (alvoX - inclinacao.current.x) * taxa;

    g.rotation.z = inclinacao.current.z;
    g.rotation.x = inclinacao.current.x;

    const total = Math.hypot(inclinacao.current.x, inclinacao.current.z);
    if (total > LIMIAR_DERRAME) derramar();

    // ---------- café dentro ----------
    if (cafe.current) {
      cafe.current.visible = temCafe.current;
      // O líquido fica na horizontal enquanto a louça gira: é o oposto da
      // rotação do grupo, o que faz a xícara parecer ter algo dentro.
      cafe.current.rotation.z = -inclinacao.current.z * 0.85;
      cafe.current.rotation.x = -inclinacao.current.x * 0.85;
    }

    // ---------- poça ----------
    if (poca.current) {
      poca.current.position.x = pocaPos.current.x;
      poca.current.position.z = pocaPos.current.z;
      const sujo = !temCafe.current;
      const restante = secaEm.current - tempo.current;
      // Cresce depressa e seca devagar nos últimos 2,5s.
      const escalaAlvo = sujo ? (restante < 2.5 ? Math.max(restante / 2.5, 0) : 1) : 0;
      const atual = poca.current.scale.x;
      const nova = atual + (escalaAlvo - atual) * (escalaAlvo > atual ? 0.12 : 0.06);
      poca.current.scale.setScalar(Math.max(nova, 0.0001));
      poca.current.visible = nova > 0.01;

      if (sujo && restante <= 0 && nova < 0.02) {
        // Secou: enche de novo e a brincadeira recomeça.
        temCafe.current = true;
        if (estado.current) estado.current.derramou = false;
      }
    }

    // ---------- gotas ----------
    const im = gotasRef.current;
    if (im) {
      const voando = tempo.current < gotasAte.current && gotas.current.length > 0;
      im.visible = voando;
      if (voando) {
        gotas.current.forEach((gota, i) => {
          gota.vy -= 2.2 * dt;
          gota.x += gota.vx * dt;
          gota.y += gota.vy * dt;
          gota.z += gota.vz * dt;
          if (gota.y < SUPERFICIE + 0.01) gota.y = SUPERFICIE + 0.01;
          matriz.makeTranslation(gota.x, gota.y, gota.z);
          im.setMatrixAt(i, matriz);
        });
        im.instanceMatrix.needsUpdate = true;
      }
    }
  });

  return (
    <>
      <group ref={grupo} position={[CASA.x, ALTURA_TAMPO, CASA.z]}>
        {/* Corpo da xícara: cilindro ABERTO em cima, para a parede interna
            existir. Fechado, o café ficava pousado numa tampa e lia como
            biscoito em cima de um copo. */}
        <mesh
          onPointerDown={aoPegar}
          /* Nada de `cursor: grab` no body: isso ressuscitaria o cursor
             nativo por cima do customizado. O canvas ganha o mesmo atributo
             que o Cursor já procura para crescer sobre coisas clicáveis. */
          onPointerOver={() => {
            if (ativo) gl.domElement.dataset.cursorGrow = "true";
          }}
          onPointerOut={() => {
            delete gl.domElement.dataset.cursorGrow;
          }}
        >
          <cylinderGeometry args={[0.075, 0.066, 0.16, 24, 1, true]} />
          <meshStandardMaterial color={COR_LOUCA} roughness={0.45} side={THREE.DoubleSide} />
        </mesh>

        {/* fundo da xícara */}
        <mesh position={[0, -0.078, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.066, 24]} />
          <meshStandardMaterial color={COR_LOUCA} roughness={0.5} />
        </mesh>

        {/* Parede interna, um tom mais escura: é ela que dá PROFUNDIDADE.
            Sem ela o olho não tem como saber que a xícara é oca. */}
        <mesh position={[0, 0.001, 0]}>
          <cylinderGeometry args={[0.0715, 0.063, 0.155, 24, 1, true]} />
          <meshStandardMaterial
            color={COR_LOUCA_DENTRO}
            roughness={0.6}
            side={THREE.BackSide}
          />
        </mesh>

        {/*
         * O café.
         *
         * Três coisas o tiram da cara de biscoito: ele fica ABAIXO da borda
         * (líquido não chega na boca da xícara), é quase preto em vez de
         * marrom claro, e tem acabamento espelhado — `roughness` 0,04 e
         * `metalness` alto fazem a luz do ambiente escorregar na superfície,
         * que é o que o olho lê como "molhado".
         */}
        <mesh ref={cafe} position={[0, 0.028, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.0695, 24]} />
          <meshStandardMaterial
            color={COR_CAFE}
            roughness={0.04}
            metalness={0.55}
            envMapIntensity={1.6}
          />
        </mesh>

        {/* asa */}
        <mesh position={[0.085, 0.01, 0]} rotation={[Math.PI / 2, 0, 0]} raycast={() => null}>
          <torusGeometry args={[0.045, 0.011, 8, 16]} />
          <meshStandardMaterial color={COR_LOUCA} roughness={0.5} />
        </mesh>
      </group>

      {/*
       * A poça fica FORA do grupo: ela pertence à mesa, não à xícara — se
       * estivesse dentro, andaria junto quando alguém movesse a xícara.
       *
       * Três discos deslocados em vez de um: café derramado não faz círculo
       * perfeito. E `roughness` baixo é o que faz ela parecer MOLHADA — com
       * acabamento fosco, marrom escuro sobre mesa escura simplesmente
       * desaparecia no quadro.
       */}
      <group
        ref={poca}
        position={[CASA.x, SUPERFICIE + 0.004, CASA.z]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.0001}
        visible={false}
      >
        <mesh raycast={() => null}>
          <circleGeometry args={[0.24, 24]} />
          <meshStandardMaterial color={COR_CAFE} roughness={0.06} metalness={0.2} />
        </mesh>
        <mesh position={[0.19, 0.09, 0.001]} raycast={() => null}>
          <circleGeometry args={[0.14, 20]} />
          <meshStandardMaterial color={COR_CAFE} roughness={0.06} metalness={0.2} />
        </mesh>
        <mesh position={[-0.15, -0.13, 0.001]} raycast={() => null}>
          <circleGeometry args={[0.1, 20]} />
          <meshStandardMaterial color={COR_CAFE} roughness={0.06} metalness={0.2} />
        </mesh>
      </group>

      <instancedMesh
        ref={gotasRef}
        args={[undefined, undefined, 5]}
        visible={false}
        raycast={() => null}
      >
        <sphereGeometry args={[0.018, 8, 6]} />
        <meshStandardMaterial color={COR_CAFE} roughness={0.25} />
      </instancedMesh>
    </>
  );
}
