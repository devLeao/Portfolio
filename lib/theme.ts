/**
 * Ponte entre os tokens CSS e a cena 3D.
 *
 * O Three precisa de número, não de `var(--color-iris)`. Em vez de repetir
 * os hex aqui — que é como paleta sai do lugar — a cena lê o valor real
 * computado do `:root`. Trocar o roxo no globals.css troca a blusa do
 * avatar e a rim light do teclado no mesmo movimento.
 *
 * O fallback existe para o primeiro frame no servidor e para o caso raro
 * de a folha ainda não ter aplicado; são cópias fiéis do globals.css.
 */

const FALLBACK = {
  "--color-void": "#0a0808",
  "--color-surface": "#141019",
  "--color-hairline": "#241c2e",
  "--color-bone": "#f5f1ea",
  "--color-muted": "#8b8489",
  "--color-iris": "#8b5cf6",
  "--color-iris-soft": "#a78bfa",
  "--color-sky-top": "#1a0b2e",
  "--color-sky-base": "#3b1e5e",
  "--color-neon": "#4ade80",
} as const;

export type TokenName = keyof typeof FALLBACK;

export function token(name: TokenName): string {
  if (typeof window === "undefined") return FALLBACK[name];

  const valor = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();

  return valor || FALLBACK[name];
}

/**
 * Luminância relativa aproximada. Serve para uma decisão só: o logo em cima
 * do keycap sai branco ou preto? Amarelo do JavaScript e do Power BI pedem
 * preto; o resto, branco.
 */
export function ehClaro(hex: string): boolean {
  const limpo = hex.replace("#", "");
  const n = parseInt(
    limpo.length === 3
      ? limpo.split("").map((c) => c + c).join("")
      : limpo,
    16
  );
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

/**
 * Marcas quase pretas (Next.js, Three.js, Vercel) somem contra a placa
 * escura do teclado. O prompt pede "preto com borda branca" — na prática,
 * levantar o corpo para um grafite e deixar o logo branco resolve melhor
 * do que uma borda, que numa peça 3D vira contorno duro.
 */
export function corDoCap(hex: string): string {
  return hex.toLowerCase() === "#000000" ? "#17171c" : hex;
}
