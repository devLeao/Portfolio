"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useSound } from "@/components/providers/SoundProvider";
import KeyboardMount from "@/components/keyboard/KeyboardMount";
import TechName from "@/components/keyboard/TechName";
import { keycaps, skills } from "@/content/content";
import { useIsMobile } from "@/lib/hooks";
import { avatarBus } from "@/lib/avatarBus";
import { corDoCap } from "@/lib/theme";

/**
 * Seção assinatura: o teclado 3D.
 *
 * Três entradas acionam o mesmo estado — clique no cap, tecla física, e botão
 * real no DOM (Tab). O 3D é `aria-hidden`; a lista focável abaixo é a versão
 * acessível da mesma coisa, e não uma decoração paralela.
 */
export default function Skills() {
  const { t } = useLocale();
  const { tocar } = useSound();
  const mobile = useIsMobile();

  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [pressionadoId, setPressionadoId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  /* A seção governa a entrada do teclado: ele cresce e gira conforme ela
     sobe na tela. Ver EntradaNoScroll. */
  const secaoRef = useRef<HTMLElement>(null);

  const porTecla = useMemo(() => {
    const mapa = new Map<string, string>();
    for (const cap of keycaps) mapa.set(cap.key.toUpperCase(), cap.id);
    return mapa;
  }, []);

  const acionar = useCallback(
    (id: string) => {
      setSelecionadoId(id);
      setPressionadoId(id);
      tocar("switch");
      // O avatar lá em cima digita junto, mais rápido. Ninguém vê os dois ao
      // mesmo tempo — é um detalhe para quem voltar ao topo depois de brincar.
      avatarBus.emitir({ tipo: "digitar" });

      // O afundamento é transitório: o cap volta sozinho, mas o nome da
      // tecnologia fica na tela até a próxima escolha.
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setPressionadoId(null), 190);
    },
    [tocar]
  );

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  /** Teclado físico. */
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // Digitar no formulário de contato não pode acionar o teclado 3D.
      const alvo = e.target as HTMLElement | null;
      if (alvo && /^(input|textarea|select)$/i.test(alvo.tagName)) return;
      if (alvo?.isContentEditable) return;

      const id = porTecla.get(e.key.toUpperCase());
      if (id) acionar(id);
    };

    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [porTecla, acionar]);

  const mostradoId = hoverId ?? selecionadoId;
  const mostrado = useMemo(
    () => keycaps.find((k) => k.id === mostradoId) ?? null,
    [mostradoId]
  );

  return (
    /*
     * Esta seção NÃO usa `.section`.
     *
     * O padding de 144px daquela classe somado a `min-h-svh` deixaria menos
     * de 480px para o conteúdo numa tela de 768 — e o teclado sozinho pede
     * 430. O resultado era a peça principal do site cortada na borda de
     * baixo. Aqui o respiro é menor e a viewport inteira é do teclado.
     */
    <section
      ref={secaoRef}
      id="skills"
      className="shell flex min-h-svh flex-col justify-center gap-4 py-20 lg:gap-2 lg:py-16"
      style={{ scrollMarginTop: "var(--header-h)" }}
    >
      {/* ---------- cabeçalho ---------- */}
      <div className="text-center">
        <h2 className="display-xl m-0 text-[clamp(2.25rem,5.5vw,4.5rem)] text-bone">
          {t(skills.title)}
        </h2>
        <p className="label mt-2">{t(mobile ? skills.hintTouch : skills.hint)}</p>
      </div>

      {/* ---------- corpo: texto à esquerda, teclado à direita ----------
          Sem `flex-1`: com ele, a grade engolia toda a altura sobrando e
          abria uma faixa morta de 170px entre o título e o teclado. Agora o
          bloco inteiro (título + grade) é que se centra na viewport. */}
      <div className="grid items-center gap-6 lg:grid-cols-[45fr_55fr] lg:gap-8">
        {/* Altura mínima trava o salto: sem ela, trocar uma tagline de duas
            linhas por uma de três empurra o teclado para baixo a cada tecla. */}
        <div className="order-2 flex min-h-[190px] items-center lg:order-1 lg:min-h-[280px]">
          {mostrado ? (
            <TechName
              key={mostrado.id}
              nome={mostrado.label}
              tagline={t(mostrado.tagline)}
              hex={corDoCap(mostrado.hex)}
            />
          ) : (
            /* Estado neutro. Sem ele, metade da seção fica um buraco preto
               esperando que a pessoa adivinhe que dá para clicar. */
            <TechName
              ocioso
              nome={t(skills.idleTitle)}
              tagline={t(mobile ? skills.idleBodyTouch : skills.idleBody)}
              hex="#F5F1EA"
            />
          )}
        </div>

        <div className="order-1 lg:order-2">
          <KeyboardMount
            fileiras={mobile ? 2 : 3}
            ativoId={pressionadoId}
            destacadoId={hoverId ?? selecionadoId}
            onSelecionar={acionar}
            onEntrar={setHoverId}
            onSair={(id) => setHoverId((atual) => (atual === id ? null : atual))}
            secao={secaoRef}
            className="h-[42svh] w-full min-h-[260px] lg:h-[56svh]"
          />
        </div>
      </div>

      {/*
       * A stack como botões de verdade. O canvas é aria-hidden — sem esta
       * lista, um leitor de tela não saberia que existe uma stack aqui, e o
       * Tab não teria onde parar. Fica fora da tela até receber foco.
       */}
      <ul aria-label={t(skills.listLabel)} className="mt-4 flex flex-wrap gap-2">
        {keycaps.map((cap) => (
          <li key={cap.id} className="sr-only focus-within:not-sr-only">
            <button
              type="button"
              onClick={() => acionar(cap.id)}
              onFocus={() => setHoverId(cap.id)}
              onBlur={() => setHoverId((atual) => (atual === cap.id ? null : atual))}
              className="rounded-full border border-hairline px-3 py-1.5 font-mono text-xs text-bone"
            >
              {cap.label}
              <span className="sr-only"> — {t(cap.tagline)}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
