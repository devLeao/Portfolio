# Leandro Leão — Portfólio

Dois mundos numa página só: o dev profissional no escuro e o criador que se
diverte no pixel cozy, separados por um portal amarrado à rolagem.

```bash
npm install
npm run dev        # http://localhost:3000 → redireciona para /pt
npm run build
npm run typecheck && npx eslint .
```

## Stack

Next.js 15 (App Router) · TypeScript estrito · Tailwind v4 · React Three Fiber
\+ drei · GSAP + ScrollTrigger · Lenis. Deploy alvo: Vercel.

## Estrutura

```
app/
  layout.tsx              fontes e tokens
  page.tsx                → redireciona para /pt
  icon.svg                favicon
  [locale]/
    layout.tsx            metadata por idioma, providers, header, cursor
    page.tsx              a ordem das seções
    opengraph-image.tsx   cartão social gerado no build, um por idioma
  api/contact/route.ts    envio da mensagem
  sitemap.ts · robots.ts
content/content.ts        TODO o texto do site, em pt e en
components/
  hero/                   avatar 3D
  keyboard/               o teclado 3D — elemento assinatura
  pixel/                  sprites, céu noturno, Bongo Cat
  sections/ providers/ shell/ ui/
lib/
  hooks.ts                media queries, viewport, visibilidade da aba
  iconAtlas.ts            atlas de logos a partir do Simple Icons
  theme.ts                ponte entre os tokens CSS e a cena 3D
```

## Decisões que valem saber

**Idioma por rota, não por toggle.** `/pt` e `/en` são páginas estáticas
distintas. Um toggle no cliente deixaria metadata, Open Graph e `hreflang` num
idioma só — o buscador nunca veria o outro.

**Conteúdo é dado.** Todo texto vive em `content/content.ts` nas duas variantes.
As taglines dos keycaps são escritas nativas em cada idioma, não traduzidas:
piada traduzida ao pé da letra morre na travessia.

**Nenhum hex mora em componente.** A paleta inteira está em `app/globals.css`,
e a cena 3D lê os mesmos valores em tempo de execução (`lib/theme.ts`). Trocar
o roxo lá troca a blusa do avatar e a rim light do teclado no mesmo movimento.

**O avatar é feito de primitivas, não de GLB.** Ready Player Me custaria 3–6MB
de host externo no caminho crítico do hero. As primitivas custam zero byte de
rede e usam o mesmo vocabulário de forma (`RoundedBox`) dos keycaps — avatar e
teclado parecem o mesmo mundo.

**O avatar responde a seis coisas**, e nenhuma delas passa por estado do
React: scroll, mouse rondando a página, CTA em foco, clique num CTA, tecla
apertada no teclado 3D, formulário enviado — e alguém derrubando o café. As
entradas chegam por `lib/avatarBus.ts`, um objeto mutável lido dentro do
`useFrame`. Passar posição de mouse por props seriam sessenta re-renders por
segundo em volta de um canvas WebGL.

**A xícara é física de verdade, não animação enlatada.** A inclinação depende
da velocidade do arrasto E da altura em que a mão pegou: quem segura pela base
consegue atravessar a mesa em segurança, quem sai puxando pela borda derruba.
O derrame emite `confuso` no barramento, e o avatar para de digitar, olha para
a bagunça, nega com a cabeça e volta ao trabalho. A poça seca em 7s e a xícara
enche de novo — senão a brincadeira só funcionaria uma vez por visita.

**O monitor mostra código de verdade.** `lib/codigoDaTela.ts` guarda trechos
reais deste repositório já tokenizados, e a textura os desenha com realce de
sintaxe. Antes eram barras cinza fingindo linhas — de perto, barra é barra.

**O rastro do cursor troca de traje por seção.** Um canvas 2D desenha um traço
neon cuja matiz avança com a DISTÂNCIA percorrida pelo ponteiro (parado, a cor
para). Dentro do mundo pixel, o `PixelWorld` marca `data-mundo="pixel"` no
`<body>` e o mesmo rastro vira quadrados grudados numa grade de 10px.

**O arcade tem dois jogos que rodam.** Cobrinha em canvas com passo de tempo
fixo — amarrado ao `requestAnimationFrame`, o jogo ficaria mais difícil num
monitor de 144Hz — e um jogo da memória com sprites em bitmap. Sem engine, sem
asset baixado. Suportam teclado e toque.

**A preferência de movimento tem override.** `prefers-reduced-motion` é
respeitado por padrão, mas quem tem a configuração ligada vê um convite
discreto para ativar as animações, e a escolha fica salva. Isso existe por um
caso real: o Windows vem com "Mostrar animações" desligado em muita máquina, e
quem cai nesse caminho vê um site sem vida e conclui que ele é estático. Quem
decide agora é o `MotionProvider`, que combina sistema e escolha — o CSS segue
pelo atributo `data-motion` no `<html>`.

**Os logos dos keycaps vêm do Simple Icons**, desenhados num único atlas de
canvas: uma textura e dois materiais para 21 caps. Power BI é a exceção — saiu
do Simple Icons junto com as outras marcas Microsoft, e o mark (três barras
ascendentes) está desenhado à mão em `lib/iconAtlas.ts`.

**O nome da tech não é geometria 3D.** `Text3D` pede uma fonte em JSON de
~200KB e o `<Text>` do troika não lê woff2, que é o que o `next/font` entrega.
A extrusão é feita com camadas de `text-shadow` dentro de um `perspective` +
`rotateY` reais: mesma leitura de volume, nítido em qualquer DPR, e o leitor de
tela lê o nome — coisa que texto dentro de canvas nunca permite.

**O som é sintetizado** com Web Audio (ruído filtrado no switch, três senoides
no twinkle do portal), não um arquivo. Mudo por padrão, com um toggle no header
que vale para o site inteiro.

**O portal é `sticky`, não `pin`.** O pin do ScrollTrigger insere um espaçador
no DOM que briga com a interpolação do Lenis e faz a seção pular na primeira
passagem. E o céu do mundo pixel é uma peça só (`PixelWorld`) — quando cada
bloco pintava o próprio gradiente, as emendas apareciam como faixas de cor.

**A câmera do teclado se ajusta ao canvas.** `AjustarCamera` mede o quadro e
recua até a placa caber, preservando a direção. Distância fixa enquadrava bem
em 1366px e cortava o teclado dos dois lados em 375px.

**Movimento reduzido corta o decorativo, não o produto.** Com movimento
reduzido em vigor: o Lenis nem é instanciado, os reveals entram prontos, o
portal vira corte seco e o 3D congela num quadro — mas continua clicável e
respondendo ao teclado físico.

## Medições

Lighthouse contra o build de produção, `/pt`:

| | mobile | desktop |
|---|---|---|
| Performance | 74 | 83 |
| Acessibilidade | 100 | 100 |
| Boas práticas | 100 | — |
| SEO | 100 | — |

FCP 0,8–1,0s · LCP 1,0–2,1s · CLS 0,033 · TBT 1,4s.

**Cuidado ao remedir:** rodar o Lighthouse com `--disable-gpu
--enable-unsafe-swiftshader` reporta TBT de ~125.000ms e derruba a nota para
59. Não é o site: com WebGL por software cada quadro leva mais de 50ms, então
o Lighthouse conta TODOS os quadros da cena 3D como tarefa longa. O mesmo
build medido com GPU dá TBT de 1.410ms. Sempre meça com GPU habilitada.

O que ainda separa de 85 no mobile é a inicialização do three.js (~1,4s numa
CPU 4× estrangulada). O único caminho honesto para fechar essa conta é não
mandar three.js para telas pequenas — avatar do hero como imagem estática
abaixo de 768px, mantendo o teclado 3D. É decisão de produto, não de código.

**Os canvases pausam sozinhos** fora da viewport (`IntersectionObserver`) e com
a aba escondida (`visibilitychange`), via `frameloop` do R3F — que desliga o
render inteiro, não só a animação.

**Acessibilidade do 3D.** Os canvases são `aria-hidden`. A stack completa
existe como lista de botões reais no DOM, focáveis por Tab, que acionam a mesma
tecla e leem a tagline.

## Formulário de contato

Sem provedor configurado, `/api/contact` responde 501 e o formulário cai no
`mailto:` com a mensagem já montada — em vez de mostrar "enviado" para algo que
não saiu. Para ativar de verdade:

```
RESEND_API_KEY=re_...
CONTACT_TO=leandrofls16@gmail.com
CONTACT_FROM=contato@seudominio.com   # domínio verificado na Resend
```

## Pendências

- **Side quests.** Os três cards do playground são placeholders marcados com
  `todo: true` em `content.ts` e se mostram como "rascunho" na tela, de
  propósito. Trocar por experimentos reais (nome, uma linha, link) e remover a
  flag.
- **A assinatura do hero** é um monograma desenhado, não o traçado real do
  Leandro. Para trocar, exporte a assinatura como SVG de traço único e
  substitua os `d` em `components/ui/Signature.tsx` — o `pathLength="1"` faz a
  animação continuar funcionando sem recalcular nada.
- **AWS e GitHub** ficaram fora do teclado: GitHub é redundante com Git na
  mesma placa, e AWS não entra sem confirmação de uso real.
- **O domínio** está fixado como `https://leandroleao.dev` em
  `app/[locale]/layout.tsx`, `sitemap.ts` e `robots.ts`. Trocar ao publicar.
