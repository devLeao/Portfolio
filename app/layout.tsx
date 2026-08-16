import type { Viewport } from "next";
import { Fraunces, Geist, Geist_Mono, Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";

/**
 * Fraunces é a única serif com eixo WONK: em corpo gigante ela lê editorial
 * e séria, mas a esquisitice já está lá dentro. Quando o portal abre, o
 * mundo pixel parece revelação e não troca de gênero.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  variable: "--font-fraunces",
  display: "swap",
});

/** Geist desaparece no texto corrido — que é exatamente o trabalho dele. */
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

/** A mono dá tom de instrumento aos rótulos, que é o assunto do site. */
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

/** Só do portal para a frente. ASCII puro, ~15KB. */
const pressStart = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-press-start",
  display: "swap",
});

/** Press Start 2P é ilegível em corpo de texto; VT323 segura o parágrafo. */
const vt323 = VT323({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-vt323",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0a0808",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${fraunces.variable} ${geist.variable} ${geistMono.variable} ${pressStart.variable} ${vt323.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-void text-bone antialiased">{children}</body>
    </html>
  );
}
