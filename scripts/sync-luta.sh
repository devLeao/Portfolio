#!/usr/bin/env bash
#
# Traz a tela de luta do jogo (../jogodeluta) para o arcade do portfólio.
#
#   npm run sync:luta
#
# O jogo é compilado no modo de teste `?luta` e servido num iframe em
# /jogos/luta/. Nada é copiado à mão para dentro de components/: o motor, os
# sprites e o ajuste fino continuam morando no repositório do jogo, e este
# script é o único caminho de lá para cá. Mexeu no jogo, roda de novo.
#
# A arte usa caminho absoluto (`/arte/...`), então ela vai para public/arte/ —
# só o que a luta carrega: o cenário do galpão e a folha do Wesley. O resto
# (cidade, casa, padaria...) é do jogo completo e não entra no portfólio.
#
# Outra pasta para o jogo: JOGO=/caminho/do/jogo npm run sync:luta

set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
JOGO="${JOGO:-$RAIZ/../jogodeluta}"
SAIDA="$(mktemp -d)"
trap 'rm -rf "$SAIDA"' EXIT

if [ ! -f "$JOGO/package.json" ]; then
  echo "Jogo não encontrado em $JOGO" >&2
  exit 1
fi

echo "Compilando $JOGO ..."
# No Git Bash do Windows, "/jogos/luta/" vira "C:/Program Files/Git/jogos/luta/"
# no caminho até o node. MSYS_NO_PATHCONV desliga isso — e por isso o outDir
# precisa ir já no formato nativo (cygpath só existe lá; fora dele, fica igual).
SAIDA_NATIVA="$(cygpath -m "$SAIDA" 2>/dev/null || echo "$SAIDA")"
(cd "$JOGO" && MSYS_NO_PATHCONV=1 npx vite build --base=/jogos/luta/ --outDir "$SAIDA_NATIVA" --emptyOutDir --logLevel warn)

DESTINO="$RAIZ/public/jogos/luta"
rm -rf "$DESTINO"
mkdir -p "$DESTINO"
cp -r "$SAIDA/assets" "$DESTINO/"
# Título e idioma da página do iframe (o Vite gera "jogodeluta" em inglês),
# e sem o favicon, que não vem junto.
sed -e 's#<html lang="en">#<html lang="pt-BR">#' \
    -e 's#<title>[^<]*</title>#<title>Briga de rua</title>#' \
    -e '/rel="icon"/d' \
    "$SAIDA/index.html" > "$DESTINO/index.html"

ARTE="$RAIZ/public/arte"
rm -rf "$ARTE"
mkdir -p "$ARTE/cenarios" "$ARTE/personagens/wesley"
cp -r "$JOGO/public/arte/cenarios/galpao" "$ARTE/cenarios/"
cp -r "$JOGO/public/arte/personagens/wesley/oficial" "$ARTE/personagens/wesley/"
find "$ARTE" -name ".gitkeep" -delete

echo "Pronto: $(du -sh "$DESTINO" | cut -f1) de código, $(du -sh "$ARTE" | cut -f1) de arte."
echo "Commit do jogo: $(cd "$JOGO" && git rev-parse --short HEAD 2>/dev/null || echo '?')$(cd "$JOGO" && [ -n "$(git status --porcelain 2>/dev/null)" ] && echo ' + alterações sem commit')"
