"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { hero } from "@/content/content";

/**
 * Hora corrente em Vespasiano.
 *
 * É um detalhe pequeno que faz um trabalho grande: um relógio que anda diz
 * "esta página está viva agora" de um jeito que nenhuma animação decorativa
 * diz. E situa quem abre o site de outro fuso.
 *
 * Renderiza vazio no servidor e preenche no cliente — a hora do servidor não
 * é a hora de ninguém, e marcar o HTML com um horário errado só geraria
 * divergência de hidratação.
 */
export default function RelogioLocal() {
  const { t, locale } = useLocale();
  const [hora, setHora] = useState<string | null>(null);

  useEffect(() => {
    const formatar = () =>
      new Intl.DateTimeFormat(locale === "pt" ? "pt-BR" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo",
        hour12: locale !== "pt",
      }).format(new Date());

    setHora(formatar());
    const id = window.setInterval(() => setHora(formatar()), 10_000);
    return () => window.clearInterval(id);
  }, [locale]);

  return (
    <p className="label m-0 flex items-center gap-2 tabular-nums">
      <span
        aria-hidden="true"
        className="motion-ambient inline-block size-1 animate-pulse rounded-full bg-iris"
      />
      {t(hero.agora)}
      {/* `min-w` reserva o espaço do relógio: sem isso a linha muda de
          largura no primeiro tique e empurra o que está ao lado. */}
      <span className="inline-block min-w-[3.2em] text-bone">{hora ?? "--:--"}</span>
    </p>
  );
}
