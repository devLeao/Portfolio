import * as THREE from "three";

/**
 * A pista é uma curva fechada e TUDO sai dela.
 *
 * Asfalto, zebra, posição dos rivais, "estou fora da pista?", "quanto falta
 * para a volta?" — tudo é pergunta sobre a mesma curva. Ela é amostrada uma
 * vez em N pontos igualmente espaçados por comprimento de arco
 * (`getSpacedPoints`), e daí em diante ninguém toca no three: o resto do jogo
 * só lê arrays. Distância ao longo da pista vira índice com uma divisão.
 */

export const LARGURA_PISTA = 14;
export const VOLTAS = 3;
/** Amostras da curva. ~1,6 unidade entre elas: fino o bastante para a zebra. */
const N = 640;
const ESCALA = 1.3;

/**
 * O traçado, em planta. Reta de largada, um S rápido à direita, um grampo
 * apertado no fundo e a curva longa de volta — o grampo é o que obriga a
 * frear, e é onde os rivais ganham ou perdem.
 */
const TRACADO: [number, number][] = [
  [0, 0],
  [80, 0],
  [140, -20],
  [170, -70],
  [150, -120],
  [100, -130],
  [70, -100],
  [40, -120],
  [0, -150],
  [-60, -140],
  [-110, -100],
  [-120, -40],
  [-80, 0],
];

export type Pista = {
  n: number;
  comprimento: number;
  /** x,z intercalados, por amostra. */
  pos: Float32Array;
  /** Tangente unitária (x,z). */
  tan: Float32Array;
  /** Normal à esquerda (x,z). Lateral positiva = esquerda de quem anda. */
  nor: Float32Array;
  /** Quanto a pista curva logo à frente (rad por unidade). Os rivais freiam por isto. */
  curva: Float32Array;
  limites: { minX: number; maxX: number; minZ: number; maxZ: number };
};

export function criarPista(): Pista {
  const curva3 = new THREE.CatmullRomCurve3(
    TRACADO.map(([x, z]) => new THREE.Vector3(x * ESCALA, 0, z * ESCALA)),
    true,
    "centripetal"
  );
  const pontos = curva3.getSpacedPoints(N);
  const comprimento = curva3.getLength();

  const pos = new Float32Array(N * 2);
  const tan = new Float32Array(N * 2);
  const nor = new Float32Array(N * 2);
  const limites = { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity };

  for (let i = 0; i < N; i++) {
    const p = pontos[i]!;
    pos[i * 2] = p.x;
    pos[i * 2 + 1] = p.z;
    limites.minX = Math.min(limites.minX, p.x);
    limites.maxX = Math.max(limites.maxX, p.x);
    limites.minZ = Math.min(limites.minZ, p.z);
    limites.maxZ = Math.max(limites.maxZ, p.z);
  }
  for (let i = 0; i < N; i++) {
    const a = (i + 1) % N;
    const b = (i - 1 + N) % N;
    let tx = pos[a * 2]! - pos[b * 2]!;
    let tz = pos[a * 2 + 1]! - pos[b * 2 + 1]!;
    const m = Math.hypot(tx, tz) || 1;
    tx /= m;
    tz /= m;
    tan[i * 2] = tx;
    tan[i * 2 + 1] = tz;
    nor[i * 2] = tz;
    nor[i * 2 + 1] = -tx;
  }

  // Curvatura com janela à frente: o rival precisa saber da curva ANTES de
  // estar nela, senão freia já dentro e sai voando.
  const passo = comprimento / N;
  const bruta = new Float32Array(N);
  const K = 6;
  for (let i = 0; i < N; i++) {
    const j = (i + K) % N;
    const a1 = Math.atan2(tan[i * 2 + 1]!, tan[i * 2]!);
    const a2 = Math.atan2(tan[j * 2 + 1]!, tan[j * 2]!);
    let d = a2 - a1;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    bruta[i] = Math.abs(d) / (K * passo);
  }
  const curva = new Float32Array(N);
  const OLHAR = 28;
  for (let i = 0; i < N; i++) {
    let m = 0;
    for (let k = 0; k < OLHAR; k++) m = Math.max(m, bruta[(i + k) % N]!);
    curva[i] = m;
  }

  return { n: N, comprimento, pos, tan, nor, curva, limites };
}

/** Índice da amostra mais próxima, procurando perto da última conhecida. */
export function maisProximo(p: Pista, x: number, z: number, dica: number): number {
  const janela = dica < 0 ? p.n / 2 : 40;
  const inicio = dica < 0 ? 0 : dica;
  let melhor = inicio;
  let menor = Infinity;
  for (let k = -janela; k <= janela; k++) {
    const i = (((inicio + k) % p.n) + p.n) % p.n;
    const dx = x - p.pos[i * 2]!;
    const dz = z - p.pos[i * 2 + 1]!;
    const d = dx * dx + dz * dz;
    if (d < menor) {
      menor = d;
      melhor = i;
    }
  }
  return melhor;
}

/** Ponto da pista à distância `s` (qualquer valor; dá a volta sozinho). */
export function noPonto(p: Pista, s: number) {
  const u = ((((s / p.comprimento) * p.n) % p.n) + p.n) % p.n;
  const i = Math.floor(u);
  const j = (i + 1) % p.n;
  const f = u - i;
  const lerp = (arr: Float32Array, k: number) => arr[i * 2 + k]! * (1 - f) + arr[j * 2 + k]! * f;
  return {
    i,
    x: lerp(p.pos, 0),
    z: lerp(p.pos, 1),
    tx: lerp(p.tan, 0),
    tz: lerp(p.tan, 1),
    nx: lerp(p.nor, 0),
    nz: lerp(p.nor, 1),
  };
}

/** Faixa ao longo da pista, de `de` a `ate` unidades de lateral. */
export function faixa(p: Pista, de: number, ate: number, repetir: number): THREE.BufferGeometry {
  const v = new Float32Array((p.n + 1) * 2 * 3);
  const uv = new Float32Array((p.n + 1) * 2 * 2);
  const idx: number[] = [];
  const passo = p.comprimento / p.n;
  for (let k = 0; k <= p.n; k++) {
    const i = k % p.n;
    const x = p.pos[i * 2]!;
    const z = p.pos[i * 2 + 1]!;
    const nx = p.nor[i * 2]!;
    const nz = p.nor[i * 2 + 1]!;
    v.set([x + nx * de, 0, z + nz * de, x + nx * ate, 0, z + nz * ate], k * 6);
    const t = (k * passo) / repetir;
    uv.set([0, t, 1, t], k * 4);
    if (k < p.n) {
      const a = k * 2;
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(v, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** O traçado como `d` de SVG, para o minimapa (que não pode importar o three). */
export function caminhoSvg(p: Pista): string {
  let d = "";
  for (let i = 0; i < p.n; i += 4) {
    d += `${i === 0 ? "M" : "L"}${p.pos[i * 2]!.toFixed(1)} ${p.pos[i * 2 + 1]!.toFixed(1)}`;
  }
  return d + "Z";
}

/** Parede vertical acompanhando a pista, a `lateral` do centro. */
export function muro(p: Pista, lateral: number, de: number, ate: number): THREE.BufferGeometry {
  const v = new Float32Array((p.n + 1) * 2 * 3);
  const idx: number[] = [];
  for (let k = 0; k <= p.n; k++) {
    const i = k % p.n;
    const x = p.pos[i * 2]! + p.nor[i * 2]! * lateral;
    const z = p.pos[i * 2 + 1]! + p.nor[i * 2 + 1]! * lateral;
    v.set([x, de, z, x, ate, z], k * 6);
    if (k < p.n) {
      const a = k * 2;
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(v, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
