/**
 * Qualificador de lead — extração por regra, rodando no navegador.
 *
 * ---------- o que isto é, exatamente ----------
 * NÃO é um modelo de linguagem. É a camada que vem ANTES dele num assistente
 * de produção: extração determinística de intenção, orçamento, prazo e
 * urgência a partir do texto cru, com um grau de confiança e uma regra de
 * quando NÃO responder.
 *
 * Por que essa camada existe no trabalho real: mandar tudo para o modelo é
 * caro e imprevisível. Uma boa parte das mensagens que chegam dá para
 * resolver com regra — e o que a regra não classifica com confiança é o que
 * vale gastar uma chamada de LLM. Este arquivo é literalmente essa triagem.
 *
 * Por que não uma API de verdade aqui: chave de modelo em site estático é
 * chave exposta, e a conta é minha. Preferi entregar algo que roda mesmo a
 * fingir uma chamada com resposta gravada.
 */

export type Analise = {
  intencao: string;
  intencaoChave: string;
  urgencia: "alta" | "media" | "baixa";
  orcamento: string;
  prazo: string;
  confianca: number;
  precisaHumano: boolean;
  foraDeEscopo: boolean;
  proximoPasso: string;
  /** Resposta em linguagem natural, montada a partir do que foi extraído. */
  resposta: string;
};

/** Cada intenção tem palavras-gatilho e o que fazer quando ela aparece. */
const INTENCOES: {
  chave: string;
  rotulo: string;
  termos: string[];
  passo: string;
  fala: string;
}[] = [
  {
    chave: "loja",
    rotulo: "e-commerce / catálogo",
    termos: ["loja", "ecommerce", "e-commerce", "catálogo", "catalogo", "vender online", "carrinho", "produtos"],
    passo: "levantar catálogo, meio de pagamento e frete",
    fala: "Loja com catálogo eu faço direto — o que muda o prazo é a quantidade de produtos e se vai ter pagamento no site ou fechamento no WhatsApp.",
  },
  {
    chave: "site",
    rotulo: "site institucional",
    termos: ["site", "página", "pagina", "landing", "institucional", "portfólio", "portfolio", "presença"],
    passo: "definir número de páginas e quem escreve os textos",
    fala: "Site institucional é o que mais faço. O prazo costuma travar no conteúdo, não no código: se os textos e fotos já existirem, anda rápido.",
  },
  {
    chave: "sistema",
    rotulo: "sistema sob medida",
    termos: ["sistema", "erp", "crm", "gestão", "gestao", "controle", "cadastro", "financeiro", "estoque"],
    passo: "mapear o processo atual antes de escrever qualquer tela",
    fala: "Sistema sob medida começa longe do código: eu preciso ver o processo que existe hoje, inclusive as planilhas soltas. É ali que aparece o que realmente precisa ser automatizado.",
  },
  {
    chave: "dados",
    rotulo: "análise de dados / painel",
    termos: ["dados", "dashboard", "painel", "bi", "power bi", "relatório", "relatorio", "indicador", "métrica", "metrica", "planilha"],
    passo: "descobrir qual decisão o painel precisa sustentar",
    fala: "Painel eu construo a partir da decisão, não da métrica: primeiro descubro o que você precisa decidir olhando pra ele, e só depois escolho o que mostrar.",
  },
  {
    chave: "automacao",
    rotulo: "automação de processo",
    termos: ["automa", "n8n", "integra", "robô", "robo", "bot", "fluxo", "zapier", "webhook", "repetitiv"],
    passo: "cronometrar a tarefa manual para dimensionar o ganho",
    fala: "Automação é o meu terreno favorito. Me conta qual tarefa se repete toda semana e quanto tempo ela leva — esse número é que decide se vale automatizar.",
  },
  {
    chave: "ia",
    rotulo: "assistente com IA",
    termos: ["ia", "inteligência artificial", "inteligencia artificial", "chatgpt", "llm", "gpt", "agente", "assistente"],
    passo: "definir onde o assistente NÃO pode responder sozinho",
    fala: "Assistente com IA eu monto com guardrail antes do modelo e uma regra clara de quando ele devolve pra uma pessoa. Sem isso, ele responde bonito até o dia em que responde errado.",
  },
  {
    chave: "manutencao",
    rotulo: "manutenção / correção",
    termos: ["arrumar", "consertar", "corrigir", "quebrou", "parou", "bug", "erro", "manutenção", "manutencao", "suporte"],
    passo: "verificar se o sistema é meu ou de terceiro",
    fala: "Dá pra olhar. Só um aviso honesto: se for um produto de terceiro (ERP de prateleira, plugin fechado), o suporte deles resolve mais rápido e mais barato que eu.",
  },
];

/** Sinais de que não é trabalho para mim. */
const FORA = ["totvs", "sap", "bling", "tiny", "protheus", "senior", "omie", "conta azul"];

const URGENTE = ["urgente", "hoje", "agora", "amanhã", "amanha", "essa semana", "esta semana", "pra ontem", "para ontem", "correndo", "rápido", "rapido"];
const CALMO = ["sem pressa", "quando der", "no futuro", "ano que vem", "orçando", "orcando", "pesquisando", "curiosidade"];

/** Acha "10 mil", "R$ 8.000", "8k", "entre 5 e 10 mil". */
function acharOrcamento(texto: string): string | null {
  const mil = texto.match(/(?:r\$\s*)?(\d{1,3})\s*(?:mil|k\b)/i);
  if (mil?.[1]) return `~R$ ${Number(mil[1]) * 1000} (declarado)`;

  const reais = texto.match(/r\$\s*([\d.]+)/i);
  if (reais?.[1]) {
    const n = Number(reais[1].replace(/\./g, ""));
    if (n > 0) return `~R$ ${n} (declarado)`;
  }
  return null;
}

/** Acha "até sexta", "em 2 semanas", "fim do mês". */
function acharPrazo(texto: string): string | null {
  if (/fim do m[êe]s|final do m[êe]s/i.test(texto)) return "fim do mês";
  if (/pr[óo]xima semana|semana que vem/i.test(texto)) return "próxima semana";

  /* Dia da semana escrito por extenso. Faltava, e "preciso até sexta" caía
     como "prazo não informado" — que é justamente o dado mais comum numa
     mensagem de cliente. */
  const dia = texto.match(
    /\b(segunda|ter[çc]a|quarta|quinta|sexta|s[áa]bado|domingo)\b/i
  );
  if (dia?.[1]) return `até ${dia[1].toLowerCase()}`;

  const semanas = texto.match(/(\d+)\s*semanas?/i);
  if (semanas?.[1]) return `${semanas[1]} semana(s)`;
  const dias = texto.match(/(\d+)\s*dias?/i);
  if (dias?.[1]) return `${dias[1]} dia(s)`;
  if (/hoje|agora/i.test(texto)) return "hoje";
  return null;
}

export function qualificar(entrada: string): Analise {
  const texto = entrada.toLowerCase();
  const palavras = texto.trim().split(/\s+/).filter(Boolean).length;

  // ---------- intenção ----------
  // Pontua por termo encontrado; a de maior pontuação vence.
  let melhor: (typeof INTENCOES)[number] | null = null;
  let melhorPonto = 0;
  for (const i of INTENCOES) {
    const ponto = i.termos.reduce((s, termo) => (texto.includes(termo) ? s + 1 : s), 0);
    if (ponto > melhorPonto) {
      melhorPonto = ponto;
      melhor = i;
    }
  }

  const foraDeEscopo = FORA.some((f) => texto.includes(f));
  const orcamento = acharOrcamento(texto);
  const prazo = acharPrazo(texto);

  const urgencia: Analise["urgencia"] = URGENTE.some((u) => texto.includes(u))
    ? "alta"
    : CALMO.some((c) => texto.includes(c))
      ? "baixa"
      : prazo
        ? "media"
        : "baixa";

  /*
   * Confiança: começa no que a intenção rendeu e sobe com cada sinal
   * concreto. Mensagem curta derruba — "oi, quero saber dos serviços" tem
   * intenção zero e cinco palavras, e classificar isso seria inventar.
   */
  let confianca = melhorPonto > 0 ? 0.5 + Math.min(melhorPonto, 3) * 0.12 : 0.18;
  if (orcamento) confianca += 0.14;
  if (prazo) confianca += 0.08;
  if (palavras >= 12) confianca += 0.06;
  if (palavras < 6) confianca -= 0.2;
  confianca = Math.max(0.05, Math.min(0.97, confianca));

  const precisaHumano = confianca < 0.55;

  // ---------- resposta em linguagem natural ----------
  const partes: string[] = [];

  if (foraDeEscopo) {
    partes.push(
      "Isso aí é produto de terceiro, e eu não mexo em sistema fechado dos outros — o suporte do fornecedor resolve mais rápido."
    );
    partes.push("Agora, se a dor for INTEGRAR esse sistema com outra coisa, ou tirar dado dele pra um painel, aí sim é comigo.");
  } else if (precisaHumano) {
    partes.push(
      "Consigo ajudar, mas com o que você escreveu eu ainda não sei o suficiente pra dizer prazo ou preço sem chutar."
    );
    partes.push("Me conta duas coisas: o que precisa existir no fim, e pra quando.");
  } else if (melhor) {
    partes.push(melhor.fala);
    if (orcamento && prazo) {
      partes.push(`Com ${orcamento.replace("~", "")} e prazo de ${prazo}, dá pra trabalhar — mando um escopo fechado.`);
    } else if (orcamento) {
      partes.push(`Orçamento anotado. Falta o prazo: tem data limite?`);
    } else if (prazo) {
      partes.push(`Prazo de ${prazo} anotado. Qual a faixa de investimento que você reservou?`);
    } else {
      partes.push("Pra fechar a conta eu preciso de duas coisas: prazo e faixa de investimento.");
    }
  }

  if (urgencia === "alta" && !precisaHumano && !foraDeEscopo) {
    partes.push("Como é urgente, respondo hoje mesmo com um plano.");
  }

  return {
    intencao: foraDeEscopo
      ? "suporte a produto de terceiro"
      : (melhor?.rotulo ?? "indefinida"),
    intencaoChave: foraDeEscopo ? "fora_escopo" : (melhor?.chave ?? "indefinida"),
    urgencia,
    orcamento: orcamento ?? "não informado",
    prazo: prazo ?? "não informado",
    confianca: Number(confianca.toFixed(2)),
    precisaHumano,
    foraDeEscopo,
    proximoPasso: foraDeEscopo
      ? "recusar educadamente · oferecer integração"
      : precisaHumano
        ? "não classificar · pedir escopo antes de responder"
        : (melhor?.passo ?? "pedir mais contexto"),
    resposta: partes.join(" "),
  };
}
