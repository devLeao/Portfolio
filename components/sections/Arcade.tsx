"use client";

import { useLocale } from "@/components/providers/LocaleProvider";
import NightSky from "@/components/pixel/NightSky";
import Snake from "@/components/pixel/Snake";
import Memoria from "@/components/pixel/Memoria";
import Luta from "@/components/pixel/Luta";
import Corrida from "@/components/pixel/Corrida";
import { arcade } from "@/content/content";

/**
 * O arcade: quatro jogos, cada um com o seu palco.
 *
 * Antes eles estavam lado a lado numa grade de duas colunas, e o resultado
 * era que nenhum parecia importante — dois quadradinhos disputando a mesma
 * atenção. Aqui cada jogo ocupa uma faixa inteira, com número, nome grande e
 * uma linha explicando a regra que o torna interessante.
 *
 * O lado do tabuleiro alterna a cada jogo. Sempre à direita, a página vira
 * uma lista; alternando, o olho tem que atravessar e a leitura desacelera —
 * que é o que se quer numa seção feita para brincar.
 */

const JOGOS = [
  { id: "snake", num: "01", nome: arcade.snake.nome, regra: arcade.snake.regra, cor: "text-neon", borda: "border-neon/60", Jogo: Snake },
  { id: "memoria", num: "02", nome: arcade.memoria.nome, regra: arcade.memoria.regra, cor: "text-cozy-blue", borda: "border-cozy-blue/60", Jogo: Memoria },
  { id: "luta", num: "03", nome: arcade.luta.nome, regra: arcade.luta.regra, cor: "text-px-pink", borda: "border-px-pink/60", Jogo: Luta },
  { id: "corrida", num: "04", nome: arcade.corrida.nome, regra: arcade.corrida.regra, cor: "text-cloud-gold", borda: "border-cloud-gold/60", Jogo: Corrida },
] as const;

export default function Arcade() {
  const { t } = useLocale();

  return (
    <section
      id="arcade"
      className="relative overflow-hidden py-20 lg:py-28"
      style={{ scrollMarginTop: "var(--header-h)" }}
    >
      <NightSky nuvens={false} className="absolute inset-0" />

      <div className="shell relative">
        <header className="text-center">
          <h2
            className="pixel-title m-0 text-[clamp(1rem,3.4vw,2.25rem)] text-cloud-gold"
            style={{ textShadow: "0 0 20px rgb(251 191 36 / 0.4)" }}
          >
            {t(arcade.titulo)}
          </h2>
          <p className="pixel-body mx-auto mt-5 max-w-[46ch] text-cloud-rose">
            {t(arcade.subtitulo)}
          </p>
        </header>

        <div className="mt-16 flex flex-col gap-16 lg:gap-24">
          {JOGOS.map(({ id, num, nome, regra, cor, borda, Jogo }, i) => (
            <article
              key={id}
              className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16"
            >
              {/* `order` inverte o lado a cada jogo, só a partir de lg — no
                  celular a coluna é uma só e a ordem tem que ser a de leitura. */}
              <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                <p className={`pixel-title m-0 text-[2rem] leading-none opacity-30 ${cor}`}>
                  {num}
                </p>
                <h3 className={`pixel-title m-0 mt-5 text-[clamp(0.875rem,2vw,1.375rem)] leading-relaxed ${cor}`}>
                  {t(nome)}
                </h3>
                <p className="pixel-body mt-5 max-w-[38ch] text-cloud-rose">
                  {t(regra)}
                </p>
              </div>

              <div
                className={`pixel-frame bg-px-card/95 p-5 ${borda} ${i % 2 === 1 ? "lg:order-1" : ""}`}
              >
                <Jogo />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
