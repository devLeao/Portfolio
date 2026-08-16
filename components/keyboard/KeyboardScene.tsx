"use client";

import { useEffect, useLayoutEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import Keycap, { PASSO, TAMANHO } from "@/components/keyboard/Keycap";
import { drawAtlas } from "@/lib/iconAtlas";
import { token } from "@/lib/theme";
import { keycaps } from "@/content/content";

/**
 * Recua a câmera até a placa inteira caber, seja qual for o formato do canvas.
 *
 * Distância fixa não serve: o mesmo valor que enquadra bem uma caixa de
 * 660×340 no desktop corta o teclado dos dois lados numa de 335×260 no
 * celular. Aqui a conta é feita a partir do tamanho real do canvas, então o
 * enquadramento é o mesmo em 375px e em 2560px.
 *
 * A DIREÇÃO da câmera é preservada — só o comprimento do vetor muda. É isso
 * que mantém o ângulo isométrico idêntico em qualquer tela.
 */
function AjustarCamera({
  largura,
  profundidade,
}: {
  largura: number;
  profundidade: number;
}) {
  const camera = useThree((e) => e.camera);
  const tamanho = useThree((e) => e.size);
  const invalidate = useThree((e) => e.invalidate);

  useLayoutEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (!tamanho.width || !tamanho.height) return;

    const proporcao = tamanho.width / tamanho.height;
    const meioFov = Math.tan(((cam.fov * Math.PI) / 180) / 2);
    /*
     * 1,16 é apertado de propósito. A placa entra em 0,62 de escala e só
     * chega a 1 quando a seção está centralizada (ver EntradaNoScroll), então
     * o pico de tamanho acontece com a seção inteira na tela — momento em que
     * não há nada embaixo para cortar a quina.
     */
    const margem = 1.16;

    // Inclinada, a profundidade da placa projeta menos altura do que mede —
    // daí o fator de encurtamento antes de comparar com o eixo vertical.
    // A placa é inclinada E girada em Y, então ela ocupa mais altura na
    // tela do que a profundidade crua sugere. O termo extra cobre isso.
    const alturaProjetada = profundidade * 0.78 + 0.62;

    const porLargura = (largura * margem) / (2 * meioFov * proporcao);
    const porAltura = (alturaProjetada * margem) / (2 * meioFov);
    const distancia = Math.max(porLargura, porAltura);

    // Direção fixa [0, 0.649, 0.761]: o ângulo de câmera não muda, só o recuo.
    cam.position.set(0, distancia * 0.649, distancia * 0.761);
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();

    /*
     * Pedir o quadro é parte do conserto, não zelo.
     *
     * Mexer na câmera fora do laço de render não desenha nada — e enquanto o
     * canvas está em `demand` (o estado dele antes de a seção entrar na tela)
     * nenhum quadro chega por conta própria. Sem este `invalidate`, o teclado
     * ficava desenhado com a câmera INICIAL, que é o enquadramento provisório
     * de `[0, 2.9, 3.4]`: dependendo da tela, a placa cai inteira fora do
     * campo de visão e o canvas parece vazio.
     */
    invalidate();
  }, [camera, tamanho, largura, profundidade, invalidate]);

  return null;
}

/**
 * A placa e os 21 caps.
 *
 * O teclado é montado por fileira a partir do `row` do content.ts, com um
 * degrau em Z e em Y por fileira — teclado real é escalonado, e sem isso a
 * peça vira um tabuleiro de damas.
 *
 * Em mobile só as fileiras 0 e 1 entram: 21 caps num quadro de 375px viram
 * confete, e o alvo de toque fica menor que o dedo.
 */
export default function KeyboardScene({
  ativo,
  ativoId,
  destacadoId,
  fileiras,
  onSelecionar,
  onEntrar,
  onSair,
}: {
  ativo: boolean;
  ativoId: string | null;
  destacadoId: string | null;
  /** Quantas fileiras mostrar (3 no desktop, 2 no mobile). */
  fileiras: number;
  onSelecionar: (id: string) => void;
  onEntrar: (id: string) => void;
  onSair: (id: string) => void;
}) {
  const roxo = useMemo(() => token("--color-iris"), []);

  /** Atlas desenhado uma vez; os dois materiais de ícone saem dele. */
  const { textura, materialIcone } = useMemo(() => {
    const canvas = drawAtlas();
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    tex.needsUpdate = true;

    const base = {
      map: tex,
      transparent: true,
      // O logo é gravação no plástico, não etiqueta acesa: sem tone mapping
      // ele brilharia mais que o cap.
      toneMapped: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    } as const;

    return {
      textura: tex,
      materialIcone: {
        claro: new THREE.MeshBasicMaterial({ ...base, color: "#FFFFFF" }),
        escuro: new THREE.MeshBasicMaterial({ ...base, color: "#0B0B0F" }),
      },
    };
  }, []);

  useEffect(
    () => () => {
      textura.dispose();
      materialIcone.claro.dispose();
      materialIcone.escuro.dispose();
    },
    [textura, materialIcone]
  );

  const visiveis = useMemo(
    () => keycaps.filter((k) => k.row < fileiras),
    [fileiras]
  );

  /** Posição de cada cap: fileira em Z, coluna em X, degrau em Y. */
  const posicoes = useMemo(() => {
    const mapa = new Map<string, [number, number, number]>();
    const porFileira = new Map<number, typeof keycaps>();

    for (const cap of visiveis) {
      const lista = porFileira.get(cap.row) ?? [];
      lista.push(cap);
      porFileira.set(cap.row, lista);
    }

    for (const [linha, lista] of porFileira) {
      const larguraTotal = (lista.length - 1) * PASSO;
      lista.forEach((cap, i) => {
        mapa.set(cap.id, [
          i * PASSO - larguraTotal / 2,
          // A fileira do fundo é a mais alta, como num teclado de verdade.
          (fileiras - 1 - linha) * 0.035,
          (linha - (fileiras - 1) / 2) * (PASSO + 0.04),
        ]);
      });
    }

    return mapa;
  }, [visiveis, fileiras]);

  const larguraPlaca = 7 * PASSO + TAMANHO * 0.7;
  const profundidadePlaca = fileiras * (PASSO + 0.04) + TAMANHO * 0.5;

  return (
    <>
      <AjustarCamera largura={larguraPlaca} profundidade={profundidadePlaca} />

      {/* key light frio de cima */}
      <directionalLight position={[1.5, 5, 2.5]} intensity={1.5} color="#E2EAFF" />
      <directionalLight position={[-2.5, 2, 1.5]} intensity={0.4} color="#9FB3D9" />
      {/* rim roxo atrás — descola a placa do fundo quase preto */}
      <pointLight position={[0, 1.6, -2.6]} intensity={9} color={roxo} distance={7} />
      <ambientLight intensity={0.22} />

      {/*
       * Environment montado com Lightformers, não com `preset`.
       *
       * `preset="city"` parece de graça e não é: o drei baixa o HDR de
       * `raw.githubusercontent.com` — 1,4MB, de host de terceiro, em toda
       * visita. Duas cenas com preset custavam 3MB de rede e derrubavam a
       * performance no mobile para 39.
       *
       * Estes retângulos são renderizados uma vez (`frames={1}`) num cubemap
       * de 256px. Custam zero byte de rede, não dependem de ninguém no ar, e
       * dão MAIS controle: são eles que aparecem refletidos no clearcoat dos
       * keycaps, então dá para desenhar o brilho em vez de torcer por ele.
       */}
      <Environment resolution={256} frames={1} environmentIntensity={0.55}>
        {/* faixa larga de cima: o realce comprido que corre no topo do cap */}
        <Lightformer
          form="rect"
          intensity={3}
          position={[0, 5, 1]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[10, 5, 1]}
          color="#E8EEFF"
        />
        {/* roxo atrás, o mesmo da rim light — reflete na quina de trás */}
        <Lightformer
          form="rect"
          intensity={2.2}
          position={[0, 2, -5]}
          scale={[8, 4, 1]}
          color={roxo}
        />
        {/* dois lampejos laterais dão a segunda quina brilhante */}
        <Lightformer form="rect" intensity={1.4} position={[-5, 2, 2]} scale={[3, 4, 1]} color="#9FB3D9" />
        <Lightformer form="rect" intensity={1.4} position={[5, 2, 2]} scale={[3, 4, 1]} color="#9FB3D9" />
      </Environment>

      {/* placa base, escura e fosca */}
      <RoundedBox
        args={[larguraPlaca, 0.22, profundidadePlaca]}
        radius={0.05}
        smoothness={4}
        position={[0, -0.19, 0]}
      >
        <meshStandardMaterial color="#0A0A0F" roughness={0.85} metalness={0.1} />
      </RoundedBox>

      {visiveis.map((cap) => {
        const p = posicoes.get(cap.id);
        if (!p) return null;
        return (
          <Keycap
            key={cap.id}
            dados={cap}
            posicao={p}
            ativo={ativoId === cap.id}
            destacado={destacadoId === cap.id}
            materialIcone={materialIcone}
            onSelecionar={onSelecionar}
            onEntrar={onEntrar}
            onSair={onSair}
          />
        );
      })}

      <ContactShadows
        position={[0, -0.31, 0]}
        opacity={0.55}
        scale={7}
        blur={2.2}
        far={2}
        resolution={512}
        frames={ativo ? Infinity : 1}
      />
    </>
  );
}
