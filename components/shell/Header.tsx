"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/providers/LocaleProvider";
import SoundToggle from "@/components/shell/SoundToggle";
import { identity, nav, LOCALES } from "@/content/content";

/**
 * Header fixo.
 *
 * Transparente enquanto a página está no topo; depois de 80px ganha fundo
 * semi-transparente e `backdrop-blur`. Sem isso, o nome gigante do hero passa
 * por baixo dos links e ninguém lê nem um nem outro.
 *
 * A altura é o token `--header-h`, o mesmo que a classe `.section` usa como
 * `scroll-margin-top` — as âncoras param exatamente embaixo dele.
 */
export default function Header() {
  const { t, locale } = useLocale();
  const pathname = usePathname();
  const [preso, setPreso] = useState(false);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    const aplicar = () => setPreso(window.scrollY > 80);
    aplicar();
    window.addEventListener("scroll", aplicar, { passive: true });
    return () => window.removeEventListener("scroll", aplicar);
  }, []);

  // Esc fecha o menu — teclado tem que sair de onde entrou.
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  const outro = LOCALES.find((l) => l !== locale) ?? "en";
  const rotaOutro = pathname.replace(`/${locale}`, `/${outro}`);
  const rotulo = locale === "pt" ? "Seções" : "Sections";

  return (
    <header
      data-preso={preso || aberto}
      className="fixed inset-x-0 top-0 z-50 transition-colors duration-300 data-[preso=true]:border-b data-[preso=true]:border-hairline data-[preso=true]:bg-void/70 data-[preso=true]:backdrop-blur-xl"
    >
      <div
        className="shell flex items-center justify-between gap-4"
        style={{ height: "var(--header-h)" }}
      >
        <Link
          href={`/${locale}`}
          onClick={() => setAberto(false)}
          className="font-display text-lg leading-none tracking-tight text-bone no-underline"
        >
          {identity.firstName[0]}
          {identity.lastName[0]}
          <span className="text-iris">.</span>
        </Link>

        {/*
         * `lg` e não `md`, e o espaçamento só larga no `xl`.
         *
         * Os dois vieram de medição, depois que a nona seção entrou no menu.
         * Com `gap-7` a fileira precisa de 828px e só cabe a partir de 1180px;
         * em 768px ela pedia 802px para uma sobra de 500px, e as duas últimas
         * seções ficavam cortadas fora da tela — inalcançáveis, porque o
         * `overflow-x: hidden` da página escondia o estouro em vez de deixar
         * rolar. Com 20px de vão a fileira cabe em 1024px com folga.
         */}
        <nav aria-label={rotulo} className="hidden lg:block">
          <ul className="flex items-center gap-5 xl:gap-7">
            {nav.items.map((item) => (
              <li key={item.id}>
                <a
                  href={item.href}
                  className="font-mono text-xs uppercase tracking-[0.14em] text-muted no-underline transition-colors hover:text-bone"
                >
                  {t(item.label)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-4">
          <SoundToggle />
          <Link
            href={rotaOutro}
            className="font-mono text-xs uppercase tracking-[0.14em] text-muted no-underline transition-colors hover:text-bone"
          >
            {outro}
          </Link>

          {/* Abaixo de lg os links não cabem na barra. Sem este botão, o site
              não tem navegação nenhuma no celular nem no tablet. */}
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            aria-expanded={aberto}
            aria-controls="menu-mobile"
            aria-label={rotulo}
            className="flex size-8 flex-col items-center justify-center gap-[5px] border-0 bg-transparent p-0 lg:hidden"
          >
            <span
              data-aberto={aberto}
              className="block h-px w-5 bg-bone transition-transform duration-300 data-[aberto=true]:translate-y-[3px] data-[aberto=true]:rotate-45"
            />
            <span
              data-aberto={aberto}
              className="block h-px w-5 bg-bone transition-transform duration-300 data-[aberto=true]:-translate-y-[3px] data-[aberto=true]:-rotate-45"
            />
          </button>
        </div>
      </div>

      {/* painel mobile */}
      <div
        id="menu-mobile"
        data-aberto={aberto}
        className="grid grid-rows-[0fr] overflow-hidden border-hairline transition-[grid-template-rows] duration-300 data-[aberto=true]:grid-rows-[1fr] data-[aberto=true]:border-t lg:hidden"
      >
        <nav aria-label={rotulo} className="min-h-0">
          <ul className="shell flex flex-col gap-1 py-4">
            {nav.items.map((item) => (
              <li key={item.id}>
                <a
                  href={item.href}
                  onClick={() => setAberto(false)}
                  className="block py-2 font-display text-2xl text-bone no-underline transition-colors hover:text-iris"
                >
                  {t(item.label)}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
