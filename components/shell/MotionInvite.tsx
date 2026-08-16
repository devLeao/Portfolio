"use client";

import { useLocale } from "@/components/providers/LocaleProvider";
import { useMotion } from "@/components/providers/MotionProvider";
import { motion as textos } from "@/content/content";

/**
 * Convite discreto para ligar as animações.
 *
 * Só aparece para quem tem `prefers-reduced-motion: reduce` e ainda não
 * escolheu nada. Depois de escolher, some para sempre — e quem ligou ganha
 * um jeito de voltar atrás no rodapé, não aqui.
 *
 * Fica no canto de baixo à esquerda, longe do toggle de som e do cursor.
 * Não bloqueia nada, não escurece a tela, não pede desculpa: é uma frase e
 * dois botões.
 */
export default function MotionInvite() {
  const { t } = useLocale();
  const { pedidoDoSistema, escolheu, definir } = useMotion();

  if (!pedidoDoSistema || escolheu) return null;

  return (
    <div
      role="region"
      aria-label={t(textos.conviteTitulo)}
      className="fixed bottom-4 left-4 z-[60] max-w-[19rem] rounded-lg border border-hairline bg-surface/95 p-4 shadow-2xl backdrop-blur-xl"
    >
      <p className="m-0 text-sm leading-snug text-bone">{t(textos.conviteTitulo)}</p>
      <p className="mt-1.5 text-xs leading-snug text-muted">{t(textos.conviteCorpo)}</p>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => definir(false)}
          className="rounded-full bg-iris px-3.5 py-1.5 font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-void transition-opacity hover:opacity-90"
        >
          {t(textos.conviteLigar)}
        </button>
        <button
          type="button"
          onClick={() => definir(true)}
          className="rounded-full border border-hairline px-3.5 py-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-muted transition-colors hover:text-bone"
        >
          {t(textos.conviteManter)}
        </button>
      </div>
    </div>
  );
}
