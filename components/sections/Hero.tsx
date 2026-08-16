"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { hero, identity } from "@/content/content";
import SplitReveal from "@/components/ui/SplitReveal";
import Signature from "@/components/ui/Signature";
import Magnetic from "@/components/ui/Magnetic";
import BrandIcon from "@/components/ui/BrandIcon";
import RelogioLocal from "@/components/hero/RelogioLocal";
import AvatarMount from "@/components/hero/AvatarMount";
import { usePrefersReducedMotion } from "@/components/providers/MotionProvider";
import { avatarBus, desfocar, focarElemento, ligarPonteiro } from "@/lib/avatarBus";

/**
 * Hero: coluna esquerda com o nome e os CTAs, coluna direita com o avatar.
 *
 * A divisão 55/45 não é decoração — o nome em corpo gigante precisa da
 * medida maior para caber em duas linhas, e o avatar precisa de altura, não
 * de largura. Nenhuma das duas colunas sobra.
 */
export default function Hero() {
  const { t } = useLocale();
  const reduzido = usePrefersReducedMotion();
  const nomeRef = useRef<HTMLDivElement>(null);

  /* Liga o rastreio do ponteiro que alimenta o olhar do avatar. Idempotente:
     pode ser chamado por qualquer um, registra o listener uma vez só. */
  useEffect(() => {
    ligarPonteiro();
  }, []);

  /** Reveal por máscara, linha a linha, no load. */
  useEffect(() => {
    const raiz = nomeRef.current;
    if (!raiz) return;

    if (reduzido) {
      raiz.dataset.pronto = "true";
      return;
    }

    let ctx: { revert: () => void } | undefined;
    let cancelado = false;

    // Se o GSAP não carregar, o nome aparece assim mesmo depois de 1,2s.
    const trava = window.setTimeout(() => {
      raiz.dataset.pronto = "true";
    }, 1200);

    (async () => {
      const { default: gsap } = await import("gsap");
      if (cancelado) return;

      window.clearTimeout(trava);
      raiz.dataset.pronto = "true";

      ctx = gsap.context(() => {
        gsap.fromTo(
          raiz.querySelectorAll("[data-linha]"),
          { yPercent: 115 },
          { yPercent: 0, duration: 1.25, ease: "expo.out", stagger: 0.11, delay: 0.12 }
        );
      }, raiz);
    })();

    return () => {
      cancelado = true;
      window.clearTimeout(trava);
      ctx?.revert();
    };
  }, [reduzido]);

  return (
    <section className="shell relative flex min-h-svh flex-col pb-10 pt-[calc(var(--header-h)+24px)]">
      {/* ---------- faixa de metadados ----------
          Ocupa o topo que sobraria acima do nome e já diz o essencial antes
          de qualquer rolagem. */}
      {/* A localização saiu daqui — ela já está no rodapé e no contato, e no
          topo só competia com o cargo. Sobrou uma linha só, e a régua embaixo
          dela ganhou respiro para o nome não nascer colado. */}
      <div className="border-b border-hairline pb-4">
        <p className="label">{t(identity.role)}</p>
      </div>

      {/* ---------- corpo do hero ---------- */}
      <div className="grid flex-1 items-center gap-2 lg:grid-cols-[55fr_45fr] lg:gap-10">
        {/* ---------- coluna esquerda ---------- */}
        {/* `gap-8` e `pt-12`: o nome estava nascendo colado na régua de cima e
            os botões colados na de baixo. Tipografia deste tamanho precisa de
            margem proporcional ao corpo, não de um respiro padrão. */}
        <div className="flex flex-col justify-center gap-8 pt-12 lg:py-6">
          <div
            ref={nomeRef}
            data-pronto="false"
            className="w-full data-[pronto=false]:invisible"
          >
            {[identity.firstName, identity.lastName].map((parte) => (
              <span key={parte} className="mask-line block">
                <span
                  data-linha
                  className="display-hero block whitespace-nowrap text-[clamp(3.25rem,10vw,9.5rem)]"
                >
                  {parte.toUpperCase()}
                </span>
              </span>
            ))}
          </div>

          {/* status + frase, juntos: os dois são "quem eu sou agora" */}
          <div className="flex flex-col gap-5">
            <p className="flex items-center gap-2.5 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted">
              <span className="relative flex size-1.5" aria-hidden="true">
                <span className="motion-ambient absolute inline-flex size-full animate-ping rounded-full bg-ok opacity-70" />
                <span className="relative inline-flex size-1.5 rounded-full bg-ok" />
              </span>
              {t(identity.available)}
            </p>

            {/* Duas linhas reservadas: sem a altura mínima, a frase reflui de
                2 para 3 linhas quando a Geist substitui a fonte de sistema e
                empurra tudo que vem depois. */}
            <SplitReveal
              as="p"
              text={t(hero.lede)}
              mode="word"
              delay={0.75}
              trigger={false}
              className="body-lg block min-h-[3.2em] max-w-[34ch] text-bone sm:min-h-[1.6em]"
            />
          </div>

          {/* `flex-nowrap`: três pílulas curtas cabem em 375px, e permitir
              wrap deixava a altura da lista à mercê da troca de fonte. */}
          <ul className="flex flex-nowrap items-center gap-2 sm:gap-3">
            {hero.links.map((link) => (
              <li key={link.label}>
                <Magnetic forca={0.4}>
                  {/*
                   * Passar o mouse aqui faz o avatar OLHAR para este botão, e
                   * clicar faz ele acenar. É o que costura as duas colunas do
                   * hero: sem isso o avatar fica num aquário, bonito e alheio
                   * ao que a pessoa está fazendo do outro lado.
                   */}
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onPointerEnter={(e) => focarElemento(e.currentTarget)}
                    onPointerLeave={desfocar}
                    onFocus={(e) => focarElemento(e.currentTarget)}
                    onBlur={desfocar}
                    onClick={() => avatarBus.emitir({ tipo: "acenar" })}
                    /* `whitespace-nowrap` + tracking menor em telas pequenas:
                       a 375px o rótulo "E-MAIL" quebrava dentro da pílula e
                       ela virava um botão de duas linhas. */
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-hairline px-3 py-2 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-bone no-underline transition-colors hover:border-iris hover:bg-[var(--iris-veil)] sm:gap-2 sm:px-4 sm:text-xs sm:tracking-[0.14em]"
                  >
                    <BrandIcon nome={link.id} className="size-3.5" />
                    {link.label}
                  </a>
                </Magnetic>
              </li>
            ))}
          </ul>
        </div>

        {/* ---------- coluna direita ---------- */}
        <div className="relative flex h-full items-center">
          {/* Altura reduzida depois que a faixa de números entrou: com 68svh
              o hero passava da viewport e os números ficavam cortados. */}
          <AvatarMount className="h-[40svh] w-full min-h-[280px] lg:h-[62svh] lg:min-h-0" />

          {/* Legenda do que o canvas mostra — o canvas é aria-hidden, então
              sem isto o avatar simplesmente não existe para leitor de tela. */}
          <p className="sr-only">{t(hero.avatarAlt)}</p>
        </div>
      </div>

      {/* ---------- rodapé do hero ----------
          Enxuto de propósito. A faixa de três números saiu daqui: "R$ 450 mil
          recuperados" é resultado de um cargo específico e pertence ao
          percurso, não ao cartão de visita — e a contagem de projetos estava
          desatualizada. Hero com muito número vira dashboard.

          Sobraram três coisas, e as três fazem trabalho: o convite a rolar, a
          hora local (prova de que a página está viva agora) e a assinatura. */}
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4 border-t border-hairline pt-6">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
          <div className="flex items-center gap-3">
            <span className="label">{t(hero.scrollHint)}</span>
            <span
              aria-hidden="true"
              className="motion-ambient h-px w-16 origin-left animate-scrollhint bg-muted"
            />
          </div>
          <RelogioLocal />
        </div>

        <Signature className="h-10 w-auto shrink-0 text-muted/70 md:h-12" />
      </div>
    </section>
  );
}
