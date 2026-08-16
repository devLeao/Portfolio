"use client";

import { useEffect, useMemo, useRef } from "react";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { atlasRect } from "@/lib/iconAtlas";
import { corDoCap, ehClaro } from "@/lib/theme";
import type { Keycap as DadosKeycap } from "@/content/content";

export const TAMANHO = 0.44;
export const ALTURA = 0.17;
export const PASSO = 0.5;

/**
 * Um keycap.
 *
 * O corpo é `RoundedBox` com material físico: `clearcoat` alto é o que dá o
 * brilho de plástico injetado. Fosco, o cap parece borracha de controle
 * remoto, e a seção inteira perde o ar de peça premium.
 *
 * O logo NÃO é um segundo material no cubo — é um plano fininho logo acima da
 * face de cima, com a UV recortada do atlas. Assim os 21 caps compartilham
 * duas materiais de ícone (branco e preto) em vez de exigirem 21 texturas.
 */
export default function Keycap({
  dados,
  posicao,
  ativo,
  destacado,
  materialIcone,
  onSelecionar,
  onEntrar,
  onSair,
}: {
  dados: DadosKeycap;
  posicao: [number, number, number];
  /** Tecla pressionada agora (afunda). */
  ativo: boolean;
  /** Hover ou foco (sobe). */
  destacado: boolean;
  materialIcone: { claro: THREE.Material; escuro: THREE.Material };
  onSelecionar: (id: string) => void;
  onEntrar: (id: string) => void;
  onSair: (id: string) => void;
}) {
  const grupo = useRef<THREE.Group>(null);
  const alvoY = useRef(0);

  const cor = useMemo(() => corDoCap(dados.hex), [dados.hex]);
  const claro = useMemo(() => ehClaro(cor), [cor]);

  /** Plano do ícone com a UV recortada da célula do atlas. */
  const geoIcone = useMemo(() => {
    const g = new THREE.PlaneGeometry(TAMANHO * 0.56, TAMANHO * 0.56);
    const { u0, v0, u1, v1 } = atlasRect(dados.icon);
    // Ordem dos vértices do PlaneGeometry: sup-esq, sup-dir, inf-esq, inf-dir.
    g.setAttribute(
      "uv",
      new THREE.Float32BufferAttribute([u0, v1, u1, v1, u0, v0, u1, v0], 2)
    );
    return g;
  }, [dados.icon]);

  useEffect(() => () => geoIcone.dispose(), [geoIcone]);

  /*
   * Altura do cap: repouso 0, hover +0.05, pressionado -0.06.
   *
   * A descida usa elástica, que é o que faz parecer switch mecânico e não
   * botão de formulário. O GSAP entra sob demanda para não pesar o bundle
   * de quem nunca chega nesta seção.
   */
  useEffect(() => {
    const el = grupo.current;
    if (!el) return;

    const destino = ativo ? -0.06 : destacado ? 0.05 : 0;
    if (destino === alvoY.current) return;
    alvoY.current = destino;

    let cancelado = false;
    (async () => {
      const { default: gsap } = await import("gsap");
      if (cancelado || !grupo.current) return;
      gsap.to(grupo.current.position, {
        y: posicao[1] + destino,
        duration: ativo ? 0.6 : 0.35,
        ease: ativo ? "elastic.out(1, 0.3)" : "power3.out",
        overwrite: true,
      });
    })();

    return () => {
      cancelado = true;
    };
  }, [ativo, destacado, posicao]);

  return (
    <group ref={grupo} position={posicao}>
      <RoundedBox
        args={[TAMANHO, ALTURA, TAMANHO]}
        radius={0.045}
        smoothness={4}
        onPointerOver={(e) => {
          e.stopPropagation();
          onEntrar(dados.id);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onSair(dados.id);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelecionar(dados.id);
        }}
      >
        <meshPhysicalMaterial
          color={cor}
          roughness={0.35}
          clearcoat={0.6}
          clearcoatRoughness={0.2}
          // O brilho na cor da marca só acende no hover: aceso sempre, os 21
          // caps viram um borrão de neon e nenhum se destaca.
          emissive={cor}
          emissiveIntensity={destacado ? 0.32 : 0}
        />
      </RoundedBox>

      <mesh
        geometry={geoIcone}
        material={claro ? materialIcone.escuro : materialIcone.claro}
        position={[0, ALTURA / 2 + 0.004, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        raycast={() => null}
      />
    </group>
  );
}
