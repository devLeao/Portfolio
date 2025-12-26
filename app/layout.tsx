import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Dev Data & AI | Portfolio",
  description: "Engenharia de Dados e Inteligência Artificial",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} bg-[#050505] text-gray-200 antialiased selection:bg-neon-green/30`}>
        {children}
      </body>
    </html>
  );
}