"use client";

import { useLocale } from "@/components/providers/LocaleProvider";
import { useMotion } from "@/components/providers/MotionProvider";
import Marquee from "@/components/ui/Marquee";
import BongoCat from "@/components/pixel/BongoCat";
import BrandIcon from "@/components/ui/BrandIcon";
import { contact, footer, identity, motion as textosMotion } from "@/content/content";

/**
 * Rodapé.
 *
 * O gato reaparece aqui pela última vez, pequeno e olhando para cima — a
 * quarta aparição do mesmo mascote. É o que faz o mundo pixel parecer parte
 * do site e não um enxerto no meio da página.
 */
export default function Footer() {
  const { t } = useLocale();
  const { reduzido, definir } = useMotion();
  const ano = new Date().getFullYear();

  return (
    <footer className="relative">
      <Marquee texto={`${identity.firstName} ${identity.lastName}`} />

      <div className="shell flex flex-col gap-8 py-12 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="label m-0">
            © {ano} {identity.fullName}. {t(footer.rights)}
          </p>
          <p className="mt-2 text-sm text-muted">{t(footer.builtWith)}</p>

          {/* O caminho de volta. Sem ele, quem clicou "ver com animação" e se
              arrependeu ficaria sem saída dentro do site. */}
          <button
            type="button"
            onClick={() => definir(!reduzido)}
            aria-pressed={reduzido}
            className="mt-3 border-0 bg-transparent p-0 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-muted underline underline-offset-4 transition-colors hover:text-bone"
          >
            {t(reduzido ? textosMotion.rodapeLigar : textosMotion.rodapeDesligar)}
          </button>
        </div>

        <div className="flex items-end gap-8">
          <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-2 p-0">
            {contact.channels.map((canal) => (
              <li key={canal.id}>
                <a
                  href={canal.href}
                  target={canal.href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-muted no-underline transition-colors hover:text-bone"
                >
                  <BrandIcon nome={canal.id} className="size-3.5" />
                  {canal.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="w-12 shrink-0 opacity-85">
            <BongoCat modo="olha" title={t(footer.catAlt)} />
          </div>
        </div>
      </div>
    </footer>
  );
}
