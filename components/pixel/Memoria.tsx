"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useSound } from "@/components/providers/SoundProvider";
import PixelSprite from "@/components/pixel/PixelSprite";
import { ESTRELA, ESTRELA_LOSANGO, PALETA_ESTRELA } from "@/components/pixel/sprites";
import { arcade } from "@/content/content";

/**
 * Jogo da memória com sprites pixel.
 *
 * Seis pares numa grade 4×3. Menos que isso é trivial, mais que isso vira
 * tarefa — e aqui a graça é durar um minuto, não testar ninguém.
 *
 * As peças são desenhadas em bitmap, como o resto do mundo pixel: nenhum
 * asset é baixado.
 */

/** Seis figuras, cada uma com sua cor. Bitmaps de 7×7. */
const FIGURAS: { id: string; bitmap: string[]; cor: string }[] = [
  {
    id: "coracao",
    cor: "#F472B6",
    bitmap: [".xx.xx.", "xxxxxxx", "xxxxxxx", "xxxxxxx", ".xxxxx.", "..xxx..", "...x..."],
  },
  {
    id: "estrela",
    cor: "#FBBF24",
    bitmap: ["...x...", "...x...", "xxxxxxx", ".xxxxx.", "..x.x..", ".x...x.", "......."],
  },
  {
    id: "gato",
    cor: "#F5F1EA",
    bitmap: ["x.....x", "xx...xx", "xxxxxxx", "x.xxx.x", "xxxxxxx", "x.xxx.x", ".xxxxx."],
  },
  {
    id: "nuvem",
    cor: "#F9A8D4",
    bitmap: ["...xx..", "..xxxx.", ".xxxxxx", "xxxxxxx", "xxxxxxx", ".......", "......."],
  },
  {
    id: "raio",
    cor: "#4ADE80",
    bitmap: ["....xx.", "...xx..", "..xxxx.", ".xxx...", "..xx...", ".xx....", "x......"],
  },
  {
    id: "lua",
    cor: "#60A5FA",
    bitmap: ["..xxx..", ".xx....", "xx.....", "xx.....", "xx.....", ".xx....", "..xxx.."],
  },
];

type Carta = { chave: string; figura: (typeof FIGURAS)[number] };

/** Embaralha com semente fixa no primeiro render e aleatório depois. */
function embaralhar(cartas: Carta[], aleatorio: boolean): Carta[] {
  const copia = [...cartas];
  if (!aleatorio) return copia;
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = copia[i];
    const b = copia[j];
    if (a && b) {
      copia[i] = b;
      copia[j] = a;
    }
  }
  return copia;
}

const BARALHO: Carta[] = FIGURAS.flatMap((f) => [
  { chave: `${f.id}-a`, figura: f },
  { chave: `${f.id}-b`, figura: f },
]);

export default function Memoria() {
  const { t } = useLocale();
  const { tocar } = useSound();

  /* Primeiro render SEM embaralhar: `Math.random` no servidor e no cliente
     dá ordens diferentes e a hidratação quebra. O baralho é sorteado no
     primeiro efeito, já no navegador. */
  const [cartas, setCartas] = useState<Carta[]>(() => embaralhar(BARALHO, false));
  const [viradas, setViradas] = useState<string[]>([]);
  const [achadas, setAchadas] = useState<string[]>([]);
  const [jogadas, setJogadas] = useState(0);
  const [comecou, setComecou] = useState(false);
  const timer = useRef<number | null>(null);

  const reiniciar = useCallback(() => {
    setCartas(embaralhar(BARALHO, true));
    setViradas([]);
    setAchadas([]);
    setJogadas(0);
    setComecou(true);
  }, []);

  useEffect(() => {
    setCartas(embaralhar(BARALHO, true));
  }, []);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const virar = (chave: string) => {
    if (!comecou) setComecou(true);
    if (viradas.length === 2) return;
    if (viradas.includes(chave)) return;

    const carta = cartas.find((c) => c.chave === chave);
    if (!carta || achadas.includes(carta.figura.id)) return;

    const novas = [...viradas, chave];
    setViradas(novas);
    tocar("virar");

    if (novas.length !== 2) return;

    setJogadas((j) => j + 1);
    const [a, b] = novas;
    const ca = cartas.find((c) => c.chave === a);
    const cb = cartas.find((c) => c.chave === b);

    if (ca && cb && ca.figura.id === cb.figura.id) {
      setAchadas((lista) => [...lista, ca.figura.id]);
      setViradas([]);
      // Vitória tem prioridade sobre o acerto: seis pares fecham o jogo.
      tocar(achadas.length + 1 === FIGURAS.length ? "vitoria" : "acerto");
      return;
    }

    // Erro: as duas ficam visíveis por um instante antes de desvirar. Sem
    // essa pausa não dá tempo de memorizar, que é o jogo inteiro.
    tocar("erro");
    // Desvirar tem som próprio, mais seco: é o "volta ao começo".
    timer.current = window.setTimeout(() => {
      setViradas([]);
      tocar("virar");
    }, 750);
  };

  const venceu = achadas.length === FIGURAS.length;

  const estrelas = useMemo(
    () => (jogadas <= 10 ? 3 : jogadas <= 16 ? 2 : 1),
    [jogadas]
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <div className="grid grid-cols-4 gap-2">
          {cartas.map((carta) => {
            const aberta =
              viradas.includes(carta.chave) || achadas.includes(carta.figura.id);

            return (
              <button
                key={carta.chave}
                type="button"
                onClick={() => virar(carta.chave)}
                aria-label={aberta ? carta.figura.id : t(arcade.memoria.carta)}
                className={`flex aspect-square items-center justify-center border-2 p-1.5 transition-colors ${
                  aberta
                    ? "border-neon bg-px-card"
                    : "border-iris/60 bg-sky-top hover:border-iris"
                }`}
              >
                {aberta ? (
                  <PixelSprite
                    bitmap={carta.figura.bitmap}
                    paleta={{ x: carta.figura.cor }}
                    className="w-full"
                  />
                ) : (
                  <PixelSprite
                    bitmap={ESTRELA_LOSANGO}
                    paleta={{ y: "#8B5CF6" }}
                    className="w-1/2 opacity-50"
                  />
                )}
              </button>
            );
          })}
        </div>

        {venceu ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-sky-top/90 p-4 text-center">
            <div className="flex gap-1">
              {Array.from({ length: estrelas }, (_, i) => (
                <PixelSprite
                  key={i}
                  bitmap={ESTRELA}
                  paleta={PALETA_ESTRELA}
                  className="w-5"
                />
              ))}
            </div>
            <p className="pixel-title m-0 text-[0.625rem] leading-relaxed text-neon">
              {t(arcade.memoria.venceu)}
            </p>
            <button
              type="button"
              onClick={reiniciar}
              className="border-2 border-neon bg-transparent px-4 py-2 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-neon transition-colors hover:bg-neon hover:text-sky-top"
            >
              {t(arcade.denovo)}
            </button>
          </div>
        ) : null}
      </div>

      <p className="pixel-body m-0 flex justify-between text-cloud-rose">
        <span>
          {t(arcade.memoria.jogadas)}: {jogadas}
        </span>
        <span>
          {achadas.length}/{FIGURAS.length}
        </span>
      </p>
    </div>
  );
}
