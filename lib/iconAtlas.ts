/**
 * Atlas de logos para os keycaps.
 *
 * Os caminhos vêm do Simple Icons — marcas reais, não reconstrução minha.
 * Todos os ícones são desenhados BRANCOS num único canvas; a cor final sai
 * do `color` do material, então caps claros recebem ícone preto sem custar
 * uma segunda textura.
 *
 * Uma textura, dois materiais, 21 geometrias de 4 vértices. A alternativa
 * — um `<img>` por cap — seriam 21 uploads de GPU e 21 draw calls.
 */

import {
  siPython,
  siMysql,
  siPostgresql,
  siLooker,
  siN8n,
  siSupabase,
  siTypescript,
  siJavascript,
  siReact,
  siNextdotjs,
  siNodedotjs,
  siTailwindcss,
  siHtml5,
  siCss,
  siThreedotjs,
  siGsap,
  siDocker,
  siGit,
  siFigma,
  siVercel,
} from "simple-icons";

/**
 * Power BI saiu do Simple Icons junto com as outras marcas Microsoft.
 * A marca é literalmente três barras ascendentes de topo arredondado —
 * isto aqui é ela, desenhada na mesma viewBox 24×24 do resto, não um
 * ícone genérico de gráfico.
 */
function barra(x: number, topo: number): string {
  const l = 4.3;
  const r = 1.4;
  const base = 21;
  return (
    `M${x} ${base}V${topo + r}` +
    `A${r} ${r} 0 0 1 ${x + r} ${topo}` +
    `H${x + l - r}` +
    `A${r} ${r} 0 0 1 ${x + l} ${topo + r}` +
    `V${base}Z`
  );
}

const POWER_BI_PATH = [barra(3.4, 12.6), barra(9.85, 7.8), barra(16.3, 3)].join(" ");

/** Caminho SVG (viewBox 24×24) de cada slug usado no content.ts. */
export const ICON_PATHS: Record<string, string> = {
  python: siPython.path,
  mysql: siMysql.path,
  postgresql: siPostgresql.path,
  powerbi: POWER_BI_PATH,
  looker: siLooker.path,
  n8n: siN8n.path,
  supabase: siSupabase.path,
  typescript: siTypescript.path,
  javascript: siJavascript.path,
  react: siReact.path,
  nextjs: siNextdotjs.path,
  node: siNodedotjs.path,
  tailwind: siTailwindcss.path,
  html: siHtml5.path,
  css: siCss.path,
  threejs: siThreedotjs.path,
  gsap: siGsap.path,
  docker: siDocker.path,
  git: siGit.path,
  figma: siFigma.path,
  vercel: siVercel.path,
};

export const ATLAS_COLS = 8;
export const ATLAS_CELL = 128;

/** Ordem fixa das células — o índice aqui é o que vira UV lá na cena. */
export const ATLAS_ORDER = Object.keys(ICON_PATHS);

export const ATLAS_ROWS = Math.ceil(ATLAS_ORDER.length / ATLAS_COLS);
export const ATLAS_W = ATLAS_COLS * ATLAS_CELL;
export const ATLAS_H = ATLAS_ROWS * ATLAS_CELL;

/** Retângulo UV (0..1, origem no canto inferior esquerdo, como no WebGL). */
export type AtlasRect = { u0: number; v0: number; u1: number; v1: number };

export function atlasRect(slug: string): AtlasRect {
  const i = ATLAS_ORDER.indexOf(slug);
  if (i < 0) return { u0: 0, v0: 0, u1: 0, v1: 0 };

  const col = i % ATLAS_COLS;
  const row = Math.floor(i / ATLAS_COLS);

  const u0 = col / ATLAS_COLS;
  const u1 = (col + 1) / ATLAS_COLS;
  // O canvas cresce para baixo e a UV para cima — daí a inversão.
  const v1 = 1 - row / ATLAS_ROWS;
  const v0 = 1 - (row + 1) / ATLAS_ROWS;

  return { u0, v0, u1, v1 };
}

/**
 * Desenha o atlas. Só roda no cliente (precisa de `document`), e só uma vez
 * — quem chama guarda o resultado.
 */
export function drawAtlas(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = ATLAS_W;
  canvas.height = ATLAS_H;

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.fillStyle = "#ffffff";

  // Margem interna: o logo não pode encostar na borda da célula, senão a
  // filtragem bilinear puxa o vizinho para dentro do cap.
  const pad = ATLAS_CELL * 0.18;
  const alvo = ATLAS_CELL - pad * 2;
  const escala = alvo / 24;

  ATLAS_ORDER.forEach((slug, i) => {
    const d = ICON_PATHS[slug];
    if (!d) return;

    const col = i % ATLAS_COLS;
    const row = Math.floor(i / ATLAS_COLS);

    ctx.save();
    ctx.translate(col * ATLAS_CELL + pad, row * ATLAS_CELL + pad);
    ctx.scale(escala, escala);
    ctx.fill(new Path2D(d));
    ctx.restore();
  });

  return canvas;
}
