"use client";

import { useLocale } from "@/components/providers/LocaleProvider";
import { useSound } from "@/components/providers/SoundProvider";
import { sound } from "@/content/content";

/**
 * Um toggle para o site todo: vale para o switch do teclado 3D e para o
 * twinkle do portal. Mudo por padrão, sempre visível no header.
 */
export default function SoundToggle() {
  const { t } = useLocale();
  const { ligado, alternar } = useSound();

  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={ligado}
      aria-label={t(sound.label)}
      className="group flex items-center gap-2 border-0 bg-transparent p-0 font-mono text-xs uppercase tracking-[0.14em] text-muted transition-colors hover:text-bone"
    >
      <span
        aria-hidden="true"
        data-on={ligado}
        className="relative block h-3 w-6 rounded-full bg-hairline transition-colors data-[on=true]:bg-iris"
      >
        <span
          data-on={ligado}
          className="absolute left-0.5 top-0.5 block size-2 rounded-full bg-bone transition-transform data-[on=true]:translate-x-3"
        />
      </span>
      <span className="hidden sm:inline">{ligado ? t(sound.on) : t(sound.off)}</span>
    </button>
  );
}
