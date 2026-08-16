"use client";

import { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Mantém a cena do avatar inteira no quadro, seja qual for o formato da caixa.
 *
 * ---------- o problema ----------
 * A câmera era fixa em `[1.28, 0.66, 3.55]`. Câmera em perspectiva tem o FOV
 * medido na VERTICAL, então a largura visível é `altura × proporção` — ela
 * encolhe sozinha quando a caixa fica mais alta que larga. E a caixa do avatar
 * é `h-[62svh]`: a altura acompanha a janela, a largura não. Medido, a
 * proporção vai de 1,186 (1366×728) a 0,633 (2560×1440). Em F11 a barra do
 * navegador some, a `svh` cresce, a caixa estica e o monitor sai pela esquerda.
 *
 * ---------- a correção que NÃO foi ----------
 * A primeira tentativa só afastou a câmera. Funcionava, mas cobrava caro: para
 * a cena caber, a distância precisava ir de 3,83 para 4,96 numa tela comum —
 * 35% de avatar a menos — e a calibragem saiu errada porque eu tomei como
 * referência um enquadramento que JÁ estava cortando.
 *
 * ---------- a correção ----------
 * A cena não está centrada no eixo da câmera: medida vértice a vértice, ela
 * ocupa de −1,35 a +0,75, ou seja está deslocada 0,30 para a esquerda. Metade
 * do corte não era falta de espaço, era mira torta. Centrar a mira devolve
 * 22% de largura de graça — e nessa proporção de F11 (1,124) a distância
 * atual passa a bastar, sem encolher nada.
 *
 * Então são dois movimentos, nessa ordem de importância:
 *
 * 1. DESLOCAR a câmera de lado, para o centro da cena cair no centro do
 *    quadro. Movimento perpendicular ao eixo de visão: a orientação não muda,
 *    a profundidade de cada ponto não muda, e o ângulo do desenho continua
 *    idêntico.
 * 2. AFASTAR, e só quando o passo 1 não bastar — em caixas realmente
 *    estreitas. Nunca aproxima mais que o enquadramento de hoje.
 *
 * ---------- os números ----------
 * Como a câmera olha para a origem e a direção é fixa, o eixo Z da câmera É a
 * direção, e as contas colapsam: para um ponto `p`, `x` e `y` em espaço de
 * câmera não dependem da distância, e a profundidade é `d − Rz·p`. Um ponto
 * cabe na horizontal quando `|Rx·p − centro| ≤ tanH · (d − Rz·p)`, ou seja
 *
 *     d ≥ |Rx·p − centro| / tanH + Rz·p
 *
 * As constantes abaixo são o máximo disso sobre os 872 vértices da cena,
 * medido em execução com a sombra de contato excluída (um plano de 3,2×3,2
 * que é CHÃO, não cena — enquadrá-la afastaria a câmera até o avatar sumir).
 */

/** Deslocamento lateral da cena no eixo X da câmera. Medido, não estimado. */
const CENTRO_X = -0.3002;

/**
 * Ramo horizontal da exigência: `d = A / tanH + C`.
 *
 * Ajustado sobre a curva exata; o erro é zero, porque abaixo de 1,05 um único
 * vértice domina — a quina de fora do monitor.
 */
const A_HORIZONTAL = 1.0491;
const C_HORIZONTAL = 0.199;

/**
 * Piso: a distância de hoje.
 *
 * Existe para o enquadramento aprovado nunca ser trocado por um mais aberto
 * quando a caixa é larga. Acima de ~1,05 de proporção quem limitaria seria a
 * altura, e ali a cena já é cortada em cima e embaixo de propósito — é
 * enquadramento, não defeito.
 */
const DISTANCIA_MIN = 3.831;

/** Teto, para uma caixa patológica não transformar o avatar num grão. */
const DISTANCIA_MAX = 7;

/** Folga para a cena não encostar na borda. */
const MARGEM = 1.03;

/** Direção fixa da câmera: `[1.28, 0.66, 3.55]` normalizado. */
const DIRECAO = new THREE.Vector3(1.28, 0.66, 3.55).normalize();

export default function AjustarCameraAvatar() {
  const camera = useThree((e) => e.camera);
  const tamanho = useThree((e) => e.size);
  const invalidate = useThree((e) => e.invalidate);

  useLayoutEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (!tamanho.width || !tamanho.height) return;

    const proporcao = tamanho.width / tamanho.height;
    const tanV = Math.tan(((cam.fov * Math.PI) / 180) / 2);
    const tanH = tanV * proporcao;

    const porLargura = (A_HORIZONTAL / tanH + C_HORIZONTAL) * MARGEM;
    const distancia = Math.min(
      DISTANCIA_MAX,
      Math.max(DISTANCIA_MIN, porLargura)
    );

    // 1. Posiciona e orienta olhando para a origem.
    cam.position.copy(DIRECAO).multiplyScalar(distancia);
    cam.lookAt(0, 0, 0);
    cam.updateMatrixWorld();

    /*
     * 2. Desliza de lado, SEM chamar lookAt de novo.
     *
     * É isso que faz o movimento ser uma translação pura: a orientação fica
     * congelada, então o eixo da câmera continua o mesmo e as constantes
     * medidas acima seguem valendo exatamente. Mirar no ponto deslocado em vez
     * de transladar giraria a câmera de leve, mudando o ângulo do desenho e
     * invalidando a medição.
     */
    const eixoX = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
    cam.position.addScaledVector(eixoX, CENTRO_X);
    cam.updateMatrixWorld();
    cam.updateProjectionMatrix();

    // Em `demand` nada disso vira quadro sem pedir. Mesma armadilha do teclado.
    invalidate();
  }, [camera, tamanho, invalidate]);

  return null;
}
