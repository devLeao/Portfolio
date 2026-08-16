"use client";

import { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Recua a câmera do avatar até a mesa inteira caber, seja qual for o formato
 * da caixa.
 *
 * ---------- o bug que isto conserta ----------
 * A câmera era fixa em `[1.28, 0.66, 3.55]`. Câmera em perspectiva tem o FOV
 * medido na VERTICAL, então a extensão horizontal visível é
 * `vertical × proporção` — ou seja, ela encolhe sozinha quando a caixa fica
 * mais alta que larga.
 *
 * E a caixa do avatar é `h-[62svh]`: a altura acompanha a janela, a largura
 * não. Medido, a proporção varia de 1,186 (1366×728) a 0,633 (2560×1440) —
 * quase metade da largura da cena desaparece entre um caso e outro. Em F11 a
 * `svh` cresce (a barra do navegador some), a caixa estica na vertical e o
 * monitor sai pela esquerda. Não é um problema do F11: é o mesmo problema em
 * qualquer tela alta, e o F11 só o deixou óbvio.
 *
 * ---------- a regra ----------
 * A direção da câmera nunca muda — só o comprimento do vetor. É isso que
 * mantém o ângulo idêntico em qualquer tela; a cena só se afasta.
 *
 * E o recuo tem piso e teto, os dois de propósito:
 *
 * · PISO na distância original. Sem ele, uma caixa larga aproximaria a câmera
 *   mais do que o enquadramento que já está aprovado.
 * · TETO em 1,6×. Numa proporção de 0,633 a conta pediria 7,18 de distância,
 *   e a essa altura o avatar vira um bonequinho no meio de um vazio. Preferir
 *   um corte discreto a um assunto minúsculo é escolha de enquadramento, não
 *   desistência.
 */

/**
 * Largura da cena, em unidades do mundo.
 *
 * Saiu de medição, não de gosto: é a largura de quadro em 1366×728
 * (proporção 1,186), a única em que a borda esquerda do monitor aparece
 * inteira. `2 × 3,831 × tan(15,5°) × 1,186`.
 */
const LARGURA_CENA = 2.52;

/** A distância que produz o enquadramento atual — o piso do recuo. */
const DISTANCIA_BASE = 3.831;

/** Direção fixa da câmera: `[1.28, 0.66, 3.55]` normalizado. */
const DIRECAO = new THREE.Vector3(1.28, 0.66, 3.55).normalize();

/** Teto do recuo, em múltiplos da distância base. Ver a nota acima. */
const TETO = 1.6;

export default function AjustarCameraAvatar() {
  const camera = useThree((e) => e.camera);
  const tamanho = useThree((e) => e.size);
  const invalidate = useThree((e) => e.invalidate);

  useLayoutEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (!tamanho.width || !tamanho.height) return;

    const proporcao = tamanho.width / tamanho.height;
    const meioFov = Math.tan(((cam.fov * Math.PI) / 180) / 2);

    const porLargura = LARGURA_CENA / (2 * meioFov * proporcao);
    const distancia = Math.min(
      DISTANCIA_BASE * TETO,
      Math.max(DISTANCIA_BASE, porLargura)
    );

    cam.position.copy(DIRECAO).multiplyScalar(distancia);
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();

    // Sem isto a mudança não vira quadro enquanto o canvas está em `demand`,
    // e a cena fica desenhada com a câmera antiga. Mesma armadilha do teclado.
    invalidate();
  }, [camera, tamanho, invalidate]);

  return null;
}
