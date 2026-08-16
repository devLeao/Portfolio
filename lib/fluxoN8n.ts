/**
 * O desenho do fluxo de cobrança — nós, posições e ligações.
 *
 * Separado do componente porque isto é DADO: a topologia não muda com o
 * React. Mexer no desenho é mexer aqui.
 *
 * Coordenadas de um `viewBox` de 1670×296. SVG escala sozinho, então o mesmo
 * desenho serve de 375px a 2560px, e o canvas rola na horizontal quando não
 * cabe — igual ao editor do n8n.
 *
 * ---------- por que a linha principal é reta ----------
 * Antes o caminho serpenteava: descia no fim e voltava para a esquerda. O
 * problema não era estético. `saidaDe` sai pela DIREITA e `entradaDe` entra
 * pela ESQUERDA, então um fio para um nó que está ATRÁS tinha que sair à
 * direita, dar a volta e entrar pela esquerda — e a alça da bezier jogava a
 * curva para fora dos dois nós. Era aquele traço sobrando depois do último
 * nó. Numa linha reta o problema não existe: todo fio anda para frente.
 *
 * ---------- por que não existe um nó "Guardrails" ----------
 * Existia, e estava errado. "Não cobrar quem tem acordo ativo" é REGRA DE
 * NEGÓCIO, e regra de negócio no n8n é um nó Filter — guardrail é outra
 * coisa: é a checagem da saída do modelo (vazamento de dado, tom, alucinação),
 * e ela mora dentro do agente, não como etapa do fluxo.
 *
 * ---------- o agente ----------
 * No n8n, o nó AI Agent não vem sozinho: modelo, memória e base vetorial
 * penduram embaixo dele por conectores pontilhados. Aqui é igual — o RAG é
 * sub-nó do agente, não uma etapa separada, porque é assim que ele funciona:
 * a busca acontece DENTRO da execução do agente, alimentando o contexto.
 */

export type TipoNo =
  | "gatilho"
  | "banco"
  | "condicao"
  | "filtro"
  | "agente"
  | "codigo"
  | "mensagem"
  | "registro"
  | "fim"
  /* sub-nós do agente */
  | "modelo"
  | "memoria"
  | "vetor";

export type No = {
  id: string;
  tipo: TipoNo;
  x: number;
  y: number;
  titulo: string;
  sub: string;
  /** Sub-nó pendurado no agente: menor e ligado por linha pontilhada. */
  filho?: boolean;
};

/*
 * As larguras saíram de MEDIÇÃO, não de gosto.
 *
 * Com 150 o subtítulo passava da borda em cinco dos oito nós — "formata a
 * mensagem" vazava 17,4px, e texto cruzando a moldura lê como bug de
 * renderização. 166 dá 112px úteis depois do ícone, e o subtítulo mais longo
 * ocupa 108 no corpo de 10px.
 */
export const LARGURA_NO = 166;
export const ALTURA_NO = 54;
export const LARGURA_FILHO = 132;
export const ALTURA_FILHO = 40;

export const NOS: No[] = [
  /* A linha principal: um Y só, da esquerda para a direita, passo de 208. */
  { id: "cron", tipo: "gatilho", x: 24, y: 30, titulo: "Cron", sub: "todo dia 09:00" },
  { id: "supabase", tipo: "banco", x: 232, y: 30, titulo: "Supabase", sub: "get cobranças" },
  { id: "if", tipo: "condicao", x: 440, y: 30, titulo: "IF", sub: "boleto em aberto?" },
  { id: "filtro", tipo: "filtro", x: 648, y: 30, titulo: "Filter", sub: "sem acordo ativo" },
  { id: "agente", tipo: "agente", x: 856, y: 30, titulo: "AI Agent", sub: "redige a cobrança" },
  { id: "codigo", tipo: "codigo", x: 1064, y: 30, titulo: "Code", sub: "formata a mensagem" },
  { id: "whatsapp", tipo: "mensagem", x: 1272, y: 30, titulo: "WhatsApp", sub: "enviar" },
  { id: "log", tipo: "registro", x: 1480, y: 30, titulo: "Log", sub: "crm + planilha" },

  /* O galho falso desce reto do IF. É o único nó fora da linha, e está fora
     de propósito: desvio tem que PARECER desvio. */
  { id: "fim", tipo: "fim", x: 440, y: 190, titulo: "No Op", sub: "nada a cobrar" },

  /* Sub-nós do agente, lado a lado e centrados embaixo dele (centro em 939). */
  { id: "modelo", tipo: "modelo", x: 729, y: 196, titulo: "Chat Model", sub: "gpt-4o mini", filho: true },
  { id: "memoria", tipo: "memoria", x: 873, y: 196, titulo: "Memory", sub: "últimas 5 trocas", filho: true },
  { id: "vetor", tipo: "vetor", x: 1017, y: 196, titulo: "Vector Store", sub: "RAG · histórico", filho: true },
];

export type Ligacao = {
  de: string;
  para: string;
  rotulo?: string;
  saida?: "direita" | "baixo";
  entrada?: "esquerda" | "cima" | "direita";
  /** Conector de sub-nó: pontilhado e sem seta, como no n8n. */
  filho?: boolean;
};

export const LIGACOES: Ligacao[] = [
  { de: "cron", para: "supabase" },
  { de: "supabase", para: "if" },
  { de: "if", para: "filtro", rotulo: "true" },
  { de: "if", para: "fim", rotulo: "false", saida: "baixo", entrada: "cima" },
  { de: "filtro", para: "agente", rotulo: "passa" },
  { de: "agente", para: "codigo" },
  { de: "codigo", para: "whatsapp" },
  { de: "whatsapp", para: "log" },

  /* pendurados no agente */
  { de: "agente", para: "modelo", saida: "baixo", entrada: "cima", filho: true },
  { de: "agente", para: "memoria", saida: "baixo", entrada: "cima", filho: true },
  { de: "agente", para: "vetor", saida: "baixo", entrada: "cima", filho: true },
];

const larg = (n: No) => (n.filho ? LARGURA_FILHO : LARGURA_NO);
const alt = (n: No) => (n.filho ? ALTURA_FILHO : ALTURA_NO);

export function saidaDe(no: No, lado: Ligacao["saida"] = "direita") {
  return lado === "baixo"
    ? { x: no.x + larg(no) / 2, y: no.y + alt(no) }
    : { x: no.x + larg(no), y: no.y + alt(no) / 2 };
}

export function entradaDe(no: No, lado: Ligacao["entrada"] = "esquerda") {
  if (lado === "cima") return { x: no.x + larg(no) / 2, y: no.y };
  if (lado === "direita") return { x: no.x + larg(no), y: no.y + alt(no) / 2 };
  return { x: no.x, y: no.y + alt(no) / 2 };
}

/**
 * Curva entre dois pontos, no estilo do n8n: bezier cúbica com as alças
 * saindo na horizontal. Reta entre nós de alturas diferentes ficaria diagonal
 * e o desenho perderia a leitura de circuito.
 */
export function curva(
  a: { x: number; y: number },
  b: { x: number; y: number },
  saida: Ligacao["saida"] = "direita",
  entrada: Ligacao["entrada"] = "esquerda"
): string {
  /*
   * ---------- por que a alça não pode ser fixa ----------
   * Era `max(52, dx * 0.5)`. Entre dois nós vizinhos o vão horizontal é de
   * 46px, então as duas alças de 52 ULTRAPASSAVAM uma à outra: a alça de
   * saída caía depois da alça de entrada.
   *
   * O desenho continuava parecendo uma reta (os quatro pontos são
   * colineares), mas a curva passava a ter derivada negativa no meio — ela
   * ia até a frente, voltava e ia de novo. `getTotalLength()` contava esse
   * vaivém, e o pacote percorria o fio dando um solavanco para trás no
   * miolo. Era boa parte da "velocidade absurda".
   *
   * Agora a alça é sempre menor que metade do vão em cada eixo, o que
   * garante uma curva monotônica.
   */
  const dist = Math.max(
    20,
    Math.min(Math.abs(b.x - a.x), 200) * 0.5 + Math.min(Math.abs(b.y - a.y), 160) * 0.4
  );

  const c1 = saida === "baixo" ? { x: a.x, y: a.y + dist * 0.7 } : { x: a.x + dist, y: a.y };

  const c2 =
    entrada === "cima"
      ? { x: b.x, y: b.y - dist * 0.7 }
      : entrada === "direita"
        ? { x: b.x + dist, y: b.y }
        : { x: b.x - dist, y: b.y };

  return `M ${a.x} ${a.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${b.x} ${b.y}`;
}

/** Ícone de cada tipo, numa caixa de 24×24. */
export const ICONES: Record<TipoNo, string> = {
  gatilho:
    "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2.5a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15ZM11 6.5v6l4.8 2.9 1-1.7-4-2.4V6.5H11Z",
  banco:
    "M12 2c-4.4 0-8 1.3-8 3v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5c0-1.7-3.6-3-8-3Zm0 2c3.9 0 6 1.1 6 1s-2.1 1-6 1-6-1.1-6-1 2.1-1 6-1Zm6 15c0 .1-2.1 1-6 1s-6-.9-6-1v-2.6c1.5.7 3.7 1.1 6 1.1s4.5-.4 6-1.1V19Zm0-5c0 .1-2.1 1-6 1s-6-.9-6-1v-2.6c1.5.7 3.7 1.1 6 1.1s4.5-.4 6-1.1V14Zm0-5c0 .1-2.1 1-6 1s-6-.9-6-1V6.4C7.5 7.1 9.7 7.5 12 7.5s4.5-.4 6-1.1V9Z",
  condicao: "M12 1.6 22.4 12 12 22.4 1.6 12 12 1.6Zm0 3.3L4.9 12l7.1 7.1 7.1-7.1L12 4.9Z",
  // funil
  filtro: "M3 4h18l-7 8.4V21l-4-2.4v-6.2L3 4Zm4.3 2 4.7 5.6L16.7 6H7.3Z",
  /* ROBÔ — cabeça com antena, dois olhos e boca. Era uma faísca genérica
     antes, e faísca é o ícone de "mágica", não de agente. */
  agente:
    "M11 1.5h2v2.1a2 2 0 0 1 1 1.7V6h3.5A3.5 3.5 0 0 1 21 9.5v8A3.5 3.5 0 0 1 17.5 21h-11A3.5 3.5 0 0 1 3 17.5v-8A3.5 3.5 0 0 1 6.5 6H10v-.7a2 2 0 0 1 1-1.7V1.5ZM6.5 8A1.5 1.5 0 0 0 5 9.5v8A1.5 1.5 0 0 0 6.5 19h11a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 17.5 8h-11ZM8 11h2.4v3H8v-3Zm5.6 0H16v3h-2.4v-3ZM8 16h8v1.6H8V16ZM1 11h1.4v5H1v-5Zm20.6 0H23v5h-1.4v-5Z",
  // chaves de código
  codigo:
    "M8.7 6.3 3 12l5.7 5.7 1.4-1.4L5.8 12l4.3-4.3-1.4-1.4Zm6.6 0-1.4 1.4L18.2 12l-4.3 4.3 1.4 1.4L21 12l-5.7-5.7Z",
  mensagem:
    "M12 2C6.5 2 2 5.8 2 10.5c0 2.6 1.4 4.9 3.6 6.5L4.5 22l4.8-2.4c.9.2 1.8.3 2.7.3 5.5 0 10-3.8 10-8.5S17.5 2 12 2Zm0 2c4.4 0 8 2.9 8 6.5S16.4 17 12 17c-.9 0-1.7-.1-2.5-.4l-.6-.2-2 1 .5-2-.6-.4C5.1 13.8 4 12.2 4 10.5 4 6.9 7.6 4 12 4Z",
  registro: "M4 3h13l4 4v14H4V3Zm2 2v14h12V7.8L16.2 5H16v5H7V5H6Zm3 0v3h5V5H9Zm-1 9h8v5H8v-5Z",
  fim: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2.5a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15ZM7.5 11v2h9v-2h-9Z",
  // faísca — o modelo de linguagem
  modelo: "M12 1.5 14 9l7.5 2-7.5 2-2 7.5-2-7.5L2.5 11 10 9l2-7.5Z",
  // espiral de memória
  memoria:
    "M12 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7v2a5 5 0 1 0 5 5h-2a3 3 0 1 1-3-3V3Z",
  // camadas do índice vetorial
  vetor: "M12 2 2 7l10 5 10-5-10-5Zm0 2.2L17.8 7 12 9.8 6.2 7 12 4.2ZM2 12l10 5 10-5-1.9-1L12 15 3.9 11 2 12Zm0 5 10 5 10-5-1.9-1L12 20 3.9 16 2 17Z",
};

export const CORES: Record<TipoNo, string> = {
  gatilho: "#FBBF24",
  banco: "#3ECF8E",
  condicao: "#A78BFA",
  filtro: "#F59E0B",
  agente: "#4ADE80",
  codigo: "#60A5FA",
  mensagem: "#25D366",
  registro: "#8B8489",
  fim: "#8B8489",
  modelo: "#A78BFA",
  memoria: "#60A5FA",
  vetor: "#F472B6",
};
