"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useHasHover } from "@/lib/hooks";
import { arcade } from "@/content/content";

/**
 * Briga de rua — a tela de luta do jogo que estou fazendo, de verdade.
 *
 * O jogo mora em outro repositório (../jogodeluta) e entra aqui compilado, num
 * iframe, pelo `npm run sync:luta`. Nada do motor é copiado para cá: o que
 * roda no portfólio é o mesmo código que roda no jogo, no modo de teste
 * `?luta`, que pula a história e cai direto no ringue.
 *
 * ---------- por que o iframe só monta no clique ----------
 * São ~330 KB de código e ~5 MB de sprite e cenário. Ninguém deveria pagar
 * isso por rolar a página. Até o clique, o lugar mostra o próprio Wesley em
 * guarda, com a caixa já no tamanho final — sem pulo de layout na troca.
 *
 * ---------- toque ----------
 * O ringue só escuta teclado. No celular, os botões abaixo da tela mandam
 * `keydown`/`keyup` para a janela do iframe — mesma origem, então é só
 * despachar o evento lá dentro. Segurar o botão é segurar a tecla.
 */

const ORIGEM = "/jogos/luta/index.html?luta";

/** Mesmas teclas que o Ringue escuta. */
const BOTOES = [
  { tecla: "ArrowLeft", rotulo: "←", nome: "esquerda" },
  { tecla: "ArrowRight", rotulo: "→", nome: "direita" },
  { tecla: "j", rotulo: "J", nome: "soco" },
  { tecla: "k", rotulo: "K", nome: "chute" },
  { tecla: "s", rotulo: "S", nome: "defesa" },
] as const;

export default function Luta() {
  const { t } = useLocale();
  const temHover = useHasHover();
  const [aberto, setAberto] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);

  // O foco vai para o jogo assim que ele carrega: sem isso, a primeira tecla
  // depois do clique rola a página em vez de mexer o lutador.
  useEffect(() => {
    if (!aberto) return;
    const f = frame.current;
    if (!f) return;
    const focar = () => f.contentWindow?.focus();
    f.addEventListener("load", focar);
    return () => f.removeEventListener("load", focar);
  }, [aberto]);

  const enviar = (tipo: "keydown" | "keyup", key: string) => {
    const janela = frame.current?.contentWindow as (Window & typeof globalThis) | null;
    if (!janela) return;
    janela.dispatchEvent(new janela.KeyboardEvent(tipo, { key, bubbles: true }));
  };

  const telaCheia = () => {
    const alvo = frame.current;
    if (!alvo) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void alvo.requestFullscreen?.().then(() => alvo.contentWindow?.focus());
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative aspect-[520/290] w-full overflow-hidden border-2 border-px-pink/60 bg-black"
      >
        {aberto ? (
          <iframe
            ref={frame}
            src={ORIGEM}
            title={t(arcade.luta.nome)}
            allow="fullscreen; autoplay"
            className="absolute inset-0 size-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setAberto(true)}
            className="group absolute inset-0 flex cursor-pointer flex-col items-center justify-end gap-3 border-0 bg-gradient-to-b from-[#140a22] to-black p-4 pb-5"
          >
            {/* Dois Wesleys em guarda — o rival é a mesma folha com o matiz
                girado, exatamente como o modo de teste do jogo faz. */}
            <span aria-hidden="true" className="flex items-end gap-[6%]">
              <Image
                src="/arte/personagens/wesley/oficial/parado_01.png"
                alt=""
                width={96}
                height={96}
                unoptimized
                className="pixelated h-auto w-[clamp(72px,22%,128px)]"
              />
              <Image
                src="/arte/personagens/wesley/oficial/parado_01.png"
                alt=""
                width={96}
                height={96}
                unoptimized
                className="pixelated h-auto w-[clamp(72px,22%,128px)] -scale-x-100"
                style={{ filter: "hue-rotate(155deg)" }}
              />
            </span>
            <span className="border-2 border-px-pink px-4 py-2 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-px-pink transition-colors group-hover:bg-px-pink group-hover:text-sky-top">
              {t(arcade.jogar)}
            </span>
          </button>
        )}
      </div>

      {aberto && !temHover ? (
        <div className="grid grid-cols-5 gap-2" aria-label={t(arcade.luta.controles)}>
          {BOTOES.map((b) => (
            <button
              key={b.tecla}
              type="button"
              aria-label={b.nome}
              onPointerDown={(e) => {
                e.preventDefault();
                e.currentTarget.setPointerCapture(e.pointerId);
                enviar("keydown", b.tecla);
              }}
              onPointerUp={() => enviar("keyup", b.tecla)}
              onPointerCancel={() => enviar("keyup", b.tecla)}
              onContextMenu={(e) => e.preventDefault()}
              className="touch-none select-none border-2 border-px-pink/60 bg-transparent py-3 font-mono text-sm text-px-pink active:bg-px-pink active:text-sky-top"
            >
              {b.rotulo}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <p className="pixel-body m-0 text-cloud-rose">
          {aberto && temHover ? t(arcade.luta.foco) : t(arcade.luta.como)}
        </p>
        {aberto ? (
          <button
            type="button"
            onClick={telaCheia}
            className="shrink-0 border-0 bg-transparent p-0 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-px-pink underline-offset-4 hover:underline"
          >
            {t(arcade.luta.telaCheia)}
          </button>
        ) : null}
      </div>
    </div>
  );
}
