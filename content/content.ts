/**
 * Fonte única de verdade do site.
 *
 * Todo texto visível mora aqui, em pt e en. Nenhum componente escreve
 * string literal — se aparece na tela, saiu deste arquivo.
 *
 * As taglines dos keycaps são escritas nativas em cada idioma, não
 * traduzidas: piada traduzida ao pé da letra morre na travessia.
 */

export const LOCALES = ["pt", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "pt";

/** Texto que existe nos dois idiomas. */
export type I18n = Record<Locale, string>;

export function t(value: I18n, locale: Locale): string {
  return value[locale];
}

/* ============================================================
   IDENTIDADE
   ============================================================ */

export const identity = {
  firstName: "Leandro",
  lastName: "Leão",
  fullName: "Leandro Filipe Silva Leão",
  role: {
    pt: "Full Stack Developer & Analista de Dados",
    en: "Full Stack Developer & Data Analyst",
  } satisfies I18n,
  location: {
    pt: "Vespasiano, MG — Brasil",
    en: "Vespasiano, Brazil",
  } satisfies I18n,
  available: {
    pt: "disponível para freela",
    en: "available for freelance",
  } satisfies I18n,
  email: "leandrofls16@gmail.com",
  phone: "+55 31 98737-3781",
  whatsapp: "https://wa.me/5531987373781",
  github: "https://github.com/devLeao",
  linkedin: "https://www.linkedin.com/in/devleao",
};

/* ============================================================
   NAVEGAÇÃO
   ============================================================ */

export const nav = {
  items: [
    { id: "sobre", href: "#sobre", label: { pt: "sobre", en: "about" } satisfies I18n },
    { id: "pratica", href: "#pratica", label: { pt: "na prática", en: "in practice" } satisfies I18n },
    { id: "skills", href: "#skills", label: { pt: "skills", en: "skills" } satisfies I18n },
    { id: "percurso", href: "#percurso", label: { pt: "percurso", en: "path" } satisfies I18n },
    { id: "projetos", href: "#projetos", label: { pt: "projetos", en: "work" } satisfies I18n },
    { id: "playground", href: "#playground", label: { pt: "playground", en: "playground" } satisfies I18n },
    { id: "arcade", href: "#arcade", label: { pt: "arcade", en: "arcade" } satisfies I18n },
    { id: "formacao", href: "#formacao", label: { pt: "formação", en: "education" } satisfies I18n },
    { id: "contato", href: "#contato", label: { pt: "contato", en: "contact" } satisfies I18n },
  ],
  skipToContent: {
    pt: "Pular para o conteúdo",
    en: "Skip to content",
  } satisfies I18n,
};

/* ============================================================
   HERO
   ============================================================ */

export const hero = {
  lede: {
    pt: "Construo o sistema e leio o dado que ele gera.",
    en: "I build the system and read the data it produces.",
  } satisfies I18n,
  scrollHint: { pt: "rolar", en: "scroll" } satisfies I18n,
  agora: { pt: "agora em Vespasiano", en: "now in Vespasiano" } satisfies I18n,
  avatarAlt: {
    pt: "Ilustração 3D do Leandro sentado à mesa, de blusa roxa, olhando para o monitor.",
    en: "3D illustration of Leandro at his desk in a purple shirt, looking at his monitor.",
  } satisfies I18n,
  links: [
    { id: "github", label: "GitHub", href: identity.github },
    { id: "linkedin", label: "LinkedIn", href: identity.linkedin },
    { id: "email", label: "E-mail", href: `mailto:${identity.email}` },
  ],
};

/* ============================================================
   SOBRE / O QUE EU FAÇO
   ============================================================ */

export type Craft = {
  id: string;
  title: I18n;
  body: I18n;
};

export const about = {
  label: { pt: "o que eu faço", en: "what I do" } satisfies I18n,
  paragraphs: [
    {
      pt: "A maioria dos devs entrega a tela. A maioria dos analistas entrega o gráfico. Eu fico no meio: entendo onde a operação perde dinheiro e construo a coisa que resolve.",
      en: "Most developers ship the screen. Most analysts ship the chart. I sit in between: I find where the operation bleeds money, then build the thing that stops it.",
    },
    {
      pt: "Trabalho com dado real de empresa e com cliente que precisa do site no ar ontem. Os dois me ensinaram a mesma coisa: entregar é o que conta.",
      en: "I work with real company data and with clients who needed the site live yesterday. Both taught me the same thing: shipping is what counts.",
    },
  ] satisfies I18n[],
  crafts: [
    {
      id: "fullstack",
      title: { pt: "Full Stack Development", en: "Full Stack Development" },
      body: {
        pt: "Do primeiro commit ao deploy. React, Next.js e Node, com banco modelado por quem vai ter que consultar depois.",
        en: "From first commit to deploy. React, Next.js and Node, with a schema designed by whoever has to query it later.",
      },
    },
    {
      id: "data",
      title: { pt: "Data & Automação", en: "Data & Automation" },
      body: {
        pt: "Pipelines em n8n, modelagem em SQL e painéis que o diretor abre às 7h e entende sem ligar pra ninguém.",
        en: "Pipelines in n8n, SQL modelling and dashboards a director opens at 7am and understands without calling anyone.",
      },
    },
    {
      id: "ai",
      title: { pt: "Integração de IA", en: "AI Integration" },
      body: {
        pt: "Assistentes com LLM em produção, com validação de precisão e alucinação — não demo bonita que quebra na segunda semana.",
        en: "LLM assistants in production, with accuracy and hallucination checks — not a pretty demo that breaks in week two.",
      },
    },
  ] satisfies Craft[],
};

/* ============================================================
   TECLADO — cada keycap é uma tecnologia

   `key` é a tecla física que aciona o cap. `hex` é a cor real da marca.
   `icon` é o slug do logo no atlas (ver lib/iconAtlas.ts).
   `row` 0 = fundo (dados), 1 = meio (dev), 2 = frente (craft).
   Em mobile só as fileiras 0 e 1 aparecem.
   ============================================================ */

export type Keycap = {
  id: string;
  label: string;
  key: string;
  hex: string;
  icon: string;
  row: number;
  tagline: I18n;
};

export const keycaps: Keycap[] = [
  /* ---------- fileira 0 · dados e automação ---------- */
  {
    id: "python", label: "Python", key: "P", hex: "#3776AB", icon: "python", row: 0,
    tagline: {
      pt: "Errou um espaço? Parabéns, o script inteiro parou.",
      en: "One wrong space and the whole script quits on you.",
    },
  },
  {
    id: "mysql", label: "MySQL", key: "M", hex: "#4479A1", icon: "mysql", row: 0,
    tagline: {
      pt: "Cinquentão, teimoso, e ainda sabe onde o dinheiro foi parar.",
      en: "Fifty, stubborn, and still knows where the money went.",
    },
  },
  {
    id: "postgresql", label: "PostgreSQL", key: "O", hex: "#4169E1", icon: "postgresql", row: 0,
    tagline: {
      pt: "MySQL nunca, Postgres pra sempre. Briga de fórum eterna.",
      en: "MySQL never, Postgres forever. The forum war never ended.",
    },
  },
  {
    id: "powerbi", label: "Power BI", key: "B", hex: "#F2C811", icon: "powerbi", row: 0,
    tagline: {
      pt: "A planilha vira reunião. A reunião vira decisão. Cobrei caro.",
      en: "Spreadsheet becomes a meeting, meeting becomes a decision. Billed accordingly.",
    },
  },
  {
    id: "looker", label: "Looker", key: "L", hex: "#4285F4", icon: "looker", row: 0,
    tagline: {
      pt: "Painel que o diretor entende às 7h sem me ligar.",
      en: "The dashboard your director reads at 7am without calling you.",
    },
  },
  {
    id: "n8n", label: "n8n", key: "8", hex: "#EA4B71", icon: "n8n", row: 0,
    tagline: {
      pt: "Aquela tarefa de segunda-feira agora acontece sem mim. Alívio.",
      en: "That Monday morning task now happens without me. Relief.",
    },
  },
  {
    id: "supabase", label: "Supabase", key: "S", hex: "#3ECF8E", icon: "supabase", row: 0,
    tagline: {
      pt: "Backend inteiro antes do café esfriar. Auth de brinde.",
      en: "A whole backend before the coffee cools. Auth included.",
    },
  },

  /* ---------- fileira 1 · dev ---------- */
  {
    id: "typescript", label: "TypeScript", key: "T", hex: "#3178C6", icon: "typescript", row: 1,
    tagline: {
      pt: "Erro no editor é bem melhor que erro no WhatsApp.",
      en: "An error in your editor beats one in your inbox.",
    },
  },
  {
    id: "javascript", label: "JavaScript", key: "J", hex: "#F7DF1E", icon: "javascript", row: 1,
    tagline: {
      pt: "undefined is not a function. Meu diagnóstico desde 2015.",
      en: "undefined is not a function. My diagnosis since 2015.",
    },
  },
  {
    id: "react", label: "React", key: "R", hex: "#61DAFB", icon: "react", row: 1,
    tagline: {
      pt: "Reescreve a tela inteira e ainda diz que é rápido.",
      en: "Rewrites the entire screen and still calls itself fast.",
    },
  },
  {
    id: "nextjs", label: "Next.js", key: "X", hex: "#000000", icon: "nextjs", row: 1,
    tagline: {
      pt: "Server, client, ou os dois? Descubro no erro de build.",
      en: "Server, client, or both? I find out at build time.",
    },
  },
  {
    id: "node", label: "Node.js", key: "N", hex: "#5FA04E", icon: "node", row: 1,
    tagline: {
      pt: "JavaScript fugiu do navegador e foi mexer no seu banco.",
      en: "JavaScript escaped the browser and went for your database.",
    },
  },
  {
    id: "tailwind", label: "Tailwind", key: "W", hex: "#06B6D4", icon: "tailwind", row: 1,
    tagline: {
      pt: "Trinta classes numa div. Não abro CSS há meses. Feliz.",
      en: "Thirty classes on one div. No CSS file in months.",
    },
  },
  {
    id: "html", label: "HTML", key: "H", hex: "#E34F26", icon: "html", row: 1,
    tagline: {
      pt: "Não é linguagem de programação. Tudo bem. Segura a internet.",
      en: "Not a programming language. Fine. Still holds the internet.",
    },
  },

  /* ---------- fileira 2 · craft e infra ---------- */
  {
    id: "css", label: "CSS", key: "C", hex: "#1572B6", icon: "css", row: 2,
    tagline: {
      pt: "Centralizei uma div. Levei duas horas. Não quero conversar.",
      en: "Centred a div. Took two hours. Don't want to talk.",
    },
  },
  {
    id: "threejs", label: "Three.js", key: "3", hex: "#000000", icon: "threejs", row: 2,
    tagline: {
      pt: "Uma esfera na tela: quatro horas. Mas gira, e gira bonito.",
      en: "One sphere on screen: four hours. But it spins beautifully.",
    },
  },
  {
    id: "gsap", label: "GSAP", key: "A", hex: "#88CE02", icon: "gsap", row: 2,
    tagline: {
      pt: "Anima qualquer coisa. Inclusive minha vontade de refazer tudo.",
      en: "Animates anything. Including my urge to redo the whole thing.",
    },
  },
  {
    id: "docker", label: "Docker", key: "D", hex: "#2496ED", icon: "docker", row: 2,
    tagline: {
      pt: "Aqui morreu o “na minha máquina funciona”. Descanse em paz.",
      en: "Here lies “works on my machine”. Rest in peace.",
    },
  },
  {
    id: "git", label: "Git", key: "G", hex: "#F05032", icon: "git", row: 2,
    tagline: {
      pt: "Force push na main. Uma vez. Nunca mais. Aprendi.",
      en: "Force pushed to main. Once. Never again. Lesson learned.",
    },
  },
  {
    id: "figma", label: "Figma", key: "F", hex: "#F24E1E", icon: "figma", row: 2,
    tagline: {
      pt: "Onde o dev descobre que o botão tinha 4px a mais.",
      en: "Where the dev learns the button was 4px too wide.",
    },
  },
  {
    id: "vercel", label: "Vercel", key: "V", hex: "#000000", icon: "vercel", row: 2,
    tagline: {
      pt: "git push e tá no ar. Simples assim, viciante assim.",
      en: "git push and it's live. That simple, that addictive.",
    },
  },
];

export const skills = {
  title: { pt: "SKILLS", en: "SKILLS" } satisfies I18n,
  hint: {
    pt: "(dica: aperte uma tecla)",
    en: "(hint: press a key)",
  } satisfies I18n,
  /* No celular não há tecla para apertar nem mouse para passar. Mandar a
     pessoa fazer o que o aparelho dela não faz é pior que não dar dica. */
  hintTouch: {
    pt: "(dica: toque num keycap)",
    en: "(hint: tap a keycap)",
  } satisfies I18n,
  idleTitle: { pt: "SKILLS", en: "SKILLS" } satisfies I18n,
  idleBody: {
    pt: "Aperte uma tecla ou passe o mouse num keycap.",
    en: "Press a key or hover a keycap.",
  } satisfies I18n,
  idleBodyTouch: {
    pt: "Toque num keycap para ver o que eu acho dele.",
    en: "Tap a keycap to see what I think of it.",
  } satisfies I18n,
  soundOn: { pt: "som ligado", en: "sound on" } satisfies I18n,
  soundOff: { pt: "som mudo", en: "sound muted" } satisfies I18n,
  soundToggleLabel: {
    pt: "Alternar som do teclado",
    en: "Toggle keyboard sound",
  } satisfies I18n,
  listLabel: {
    pt: "Tecnologias da stack",
    en: "Stack technologies",
  } satisfies I18n,
};

/* ============================================================
   PERCURSO
   ============================================================ */

export type Role = {
  id: string;
  org: I18n;
  title: I18n;
  period: string;
  current?: boolean;
  points: I18n[];
};

export const experience: Role[] = [
  {
    id: "performance",
    org: { pt: "in8 Holding", en: "in8 Holding" },
    title: {
      pt: "Assistente de Processos com IA — Núcleo de Performance",
      en: "AI Process Assistant — Performance Unit",
    },
    period: "2026 —",
    current: true,
    points: [
      {
        pt: "Mapeei créditos vencidos que ninguém acompanhava e conduzo a recuperação deles.",
        en: "Mapped overdue receivables nobody was tracking, and I'm running the recovery.",
      },
      {
        pt: "Cuido do caixa dos dois lados: se o que a empresa paga está certo, e se o que ela cobra está certo.",
        en: "I watch cash from both sides: whether what the company pays is right, and whether what it charges is right.",
      },
      {
        pt: "Fechei o acesso ao sistema para conta inadimplente — antes dava para seguir usando sem pagar.",
        en: "Cut off system access for delinquent accounts — it used to be possible to keep using it without paying.",
      },
      {
        pt: "Levantei o passivo geral da empresa e acompanho tudo pelos painéis que eu mesmo construo.",
        en: "Mapped the company's total liabilities, and I track all of it through dashboards I build myself.",
      },
      {
        pt: "Desenvolvo o sistema financeiro interno que substitui a solução terceirizada.",
        en: "Building the in-house finance system that replaces the third-party tool.",
      },
    ],
  },
  {
    id: "bi",
    org: { pt: "in8 Holding", en: "in8 Holding" },
    title: {
      pt: "Analista de BI e Automação — Estágio",
      en: "BI & Automation Analyst — Internship",
    },
    period: "2025 — 2026",
    points: [
      {
        pt: "Pipelines ETL/ELT em n8n integrando Supabase, Sheets, Mautic e bancos relacionais.",
        en: "ETL/ELT pipelines in n8n wiring together Supabase, Sheets, Mautic and relational databases.",
      },
      {
        pt: "Assistentes com LLM em produção para qualificação de leads, com validação de precisão e alucinação.",
        en: "LLM assistants in production for lead qualification, with accuracy and hallucination checks.",
      },
    ],
  },
  {
    id: "amplio",
    org: { pt: "Amplio Móveis", en: "Amplio Móveis" },
    title: {
      pt: "Auxiliar de PCP — Planejamento e Controle de Produção",
      en: "Production Planning Assistant",
    },
    period: "2023 — 2024",
    points: [
      {
        pt: "Modelei o consumo de matéria-prima em Python e achei os padrões de desperdício que otimizaram o plano de corte.",
        en: "Modelled raw-material usage in Python and found the waste patterns that optimised the cutting plan.",
      },
    ],
  },
  {
    id: "devleao",
    org: { pt: "DevLeão", en: "DevLeão" },
    title: { pt: "Projetos próprios e freelance", en: "Own projects and freelance" },
    period: "2024 —",
    points: [
      {
        pt: "Aplicações web, landing pages e APIs para clientes, do primeiro commit ao deploy.",
        en: "Web apps, landing pages and APIs for clients, from first commit to deploy.",
      },
    ],
  },
];

export const experienceSection = {
  title: { pt: "PERCURSO", en: "PATH" } satisfies I18n,
  now: { pt: "agora", en: "now" } satisfies I18n,
};

/* ============================================================
   PROJETOS

   Três blocos, nesta ordem: o sistema de agenda (destaque), os sites e
   portais, e os estudos. Estudo não é cliente — fica separado e rotulado.
   ============================================================ */

export type Project = {
  id: string;
  index: string;
  name: string;
  year: string;
  href: string;
  image: string;
  /** Texto alternativo da imagem; sem ele, o card usa o nome do projeto. */
  alt?: I18n;
  blurb: I18n;
  stack: string[];
};

/* ---------- (a) agenda e gestão de clientes ---------- */

export type BookingClient = {
  id: string;
  name: string;
  segment: I18n;
  /** "live" = no ar com o negócio usando; "prototype" = dados e login fictícios. */
  status: "live" | "prototype";
  year: string;
  href: string;
  image: string;
  alt: I18n;
  blurb: I18n;
  stack: string[];
};

export const bookingSystem = {
  title: { pt: "Agenda e gestão de clientes", en: "Booking and client management" } satisfies I18n,
  tag: { pt: "um sistema, três negócios", en: "one system, three businesses" } satisfies I18n,
  lead: {
    pt: "Agendamento online para quem vive de hora marcada. O cliente entra com a conta Google, escolhe serviço, dia e horário, e cancela sozinho dentro do prazo. Quem falta sem avisar fica com pendência e só volta a agendar depois de pagar.",
    en: "Online booking for businesses that run on appointments. Clients sign in with Google, pick a service, day and time, and can cancel on their own within the notice window. A no-show leaves an outstanding balance, and booking stays locked until it's paid.",
  } satisfies I18n,
  features: [
    {
      pt: "Agenda em tempo real, com mais de um serviço no mesmo horário e checagem de conflito.",
      en: "Real-time schedule, several services in one slot, and clash checks.",
    },
    {
      pt: "Prazo de cancelamento, falta marcada pelo dono e multa sobre o valor do serviço.",
      en: "Cancellation window, no-shows flagged by the owner, and a fine on the service price.",
    },
    {
      pt: "Agendamento bloqueado até a pendência ser paga, com Pix gerado no próprio site.",
      en: "Booking locked until the balance is cleared, with a Pix code generated on the site.",
    },
    {
      pt: "Painel do dono: agenda do dia, bloqueio de dias e horários, ficha do cliente com histórico e observações, débitos avulsos, catálogo e relatórios.",
      en: "Owner dashboard: daily schedule, blocked days and slots, client records with history and notes, manual charges, catalogue and reports.",
    },
  ] satisfies I18n[],
  code: {
    pt: "Duas gerações de código. A Cadu Barber roda a primeira, com Firebase. Arian Barber e Ana Laura partem de uma mesma base nova, cada uma no próprio repositório, com o catálogo e as regras de cada negócio.",
    en: "Two generations of code. Cadu Barber runs the first one, on Firebase. Arian Barber and Ana Laura share a newer codebase, each in its own repository, with each business's own catalogue and rules.",
  } satisfies I18n,
  note: {
    pt: "A Cadu está no ar, com cliente agendando. Arian e Ana Laura estão em protótipo: site e painel funcionam com dados e login fictícios, para os donos validarem antes de o backend entrar.",
    en: "Cadu is live, with clients booking. Arian and Ana Laura are prototypes: site and dashboard run on fictitious data and login, so the owners can sign off before the backend goes in.",
  } satisfies I18n,
  status: {
    live: { pt: "no ar", en: "live" } satisfies I18n,
    prototype: { pt: "protótipo", en: "prototype" } satisfies I18n,
  },
};

export const bookingClients: BookingClient[] = [
  {
    id: "cadu-barber",
    name: "Cadu Barber",
    segment: { pt: "Barbearia", en: "Barbershop" },
    status: "live",
    year: "2024",
    href: "https://cadubarber.com.br/",
    image: "/sitecadubarber.png",
    alt: {
      pt: "Página inicial da Cadu Barber: logotipo dourado e o título “A referência da região” ao lado de uma foto de clientes reunidos na barbearia.",
      en: "Cadu Barber home page: gold logo and the headline “A referência da região” next to a photo of customers gathered in the barbershop.",
    },
    blurb: {
      pt: "Login Google, falta marcada pelo dono, lista negra e bloqueio de dias e horários.",
      en: "Google login, owner-flagged no-shows, a blacklist, and blocked days and slots.",
    },
    stack: ["React", "Firebase Auth", "Firestore"],
  },
  {
    id: "arian-barber",
    name: "Arian Barber",
    segment: { pt: "Barbearia", en: "Barbershop" },
    status: "prototype",
    year: "2026",
    href: "https://arianbarber.vercel.app/",
    image: "/casearianbarber.png",
    alt: {
      pt: "Página inicial da Arian Barber: fundo escuro com foto de um corte, o título “Tradição na navalha.” e botões para agendar horário e ver serviços.",
      en: "Arian Barber home page: dark background with a haircut photo, the headline “Tradição na navalha.” and buttons to book and see services.",
    },
    blurb: {
      pt: "Vários serviços num horário só, multa por falta e uma vitrine de produtos para separar e retirar no próximo corte.",
      en: "Several services in one slot, no-show fines, and a product shelf to reserve and pick up at the next cut.",
    },
    stack: ["React", "Vite", "Tailwind"],
  },
  {
    id: "ana-laura",
    name: "Ana Laura",
    segment: { pt: "Cílios e sobrancelhas", en: "Lashes and brows" },
    status: "prototype",
    year: "2026",
    href: "https://analaura.vercel.app/",
    image: "/caseanalaura.png",
    alt: {
      pt: "Página inicial do estúdio Ana Laura · Lash & Brow: fundo rosado, o título “Seu olhar, em evidência.”, ilustração de cílios e botão de agendar horário.",
      en: "Ana Laura · Lash & Brow home page: blush background, the headline “Seu olhar, em evidência.”, an eyelash illustration and a booking button.",
    },
    blurb: {
      pt: "Cada modelo de cílio tem aplicação e manutenção com preço e prazo próprios. Serviços e preços já são os reais.",
      en: "Each lash style has its own application and refill, each with its own price and interval. Services and prices are already the real ones.",
    },
    stack: ["React", "Vite", "Tailwind"],
  },
];

/* ---------- (b) sites e portais ---------- */

export const projects: Project[] = [
  {
    id: "jp-transportes",
    index: "01",
    name: "JP Transportes e Viagens",
    year: "2025",
    href: "https://jptransportes.vercel.app/",
    image: "/case-jptransportes.png",
    blurb: {
      pt: "Frota inteira navegável e orçamento que cai direto no WhatsApp de quem vende.",
      en: "A browsable fleet and a quote that lands straight in the salesperson's WhatsApp.",
    },
    stack: ["Next.js", "React", "Tailwind", "Vercel"],
  },
  {
    id: "fem7",
    index: "02",
    name: "Federação Mineira de Futebol 7",
    year: "2025",
    href: "https://fem7soc.org/",
    image: "/case-fem7.png",
    blurb: {
      pt: "Portal da federação com área restrita de árbitro e as súmulas oficiais num lugar só.",
      en: "Federation portal with a referee-only area and every official match sheet in one place.",
    },
    stack: ["Next.js", "React", "Tailwind"],
  },
  {
    id: "x1-da-norte",
    index: "03",
    name: "X1 da Norte",
    year: "2026",
    href: "https://x1danorte.vercel.app/",
    image: "/casex1.png",
    alt: {
      pt: "Página inicial do X1 da Norte: título “Aonde os brabos se encontram” em preto e dourado ao lado de uma montagem com os atletas da liga.",
      en: "X1 da Norte home page: the headline “Aonde os brabos se encontram” in black and gold next to a composite of the league's players.",
    },
    blurb: {
      pt: "A casa da liga de X1 de futebol de BH: data e local da próxima edição, regras do ranking, campeões e notícias. Desafiante se apresenta por vídeo no Instagram.",
      en: "Home of a 1v1 football league in Belo Horizonte: the next event's date and venue, ranking rules, champions and news. Challengers step up by video on Instagram.",
    },
    stack: ["Next.js", "TypeScript", "Tailwind", "Vercel"],
  },
  {
    id: "devleao",
    index: "04",
    name: "DevLeão",
    year: "2024 —",
    href: "https://devleaoagencia.netlify.app/",
    image: "/case-devleao.png",
    blurb: {
      pt: "Minha operação de freela: landing, institucional, e-commerce e sistema sob medida.",
      en: "My freelance shop: landing pages, brand sites, storefronts and custom systems.",
    },
    stack: ["Next.js", "TypeScript", "Supabase", "Node.js"],
  },
];

/* ---------- (c) estudos ----------
   Sem imagem de capa: o print do clone é dominado pelo logotipo da marca. */

export type Study = {
  id: string;
  name: string;
  href: string;
  label: I18n;
  stack: string[];
};

export const studies: Study[] = [
  {
    id: "starbucks",
    name: "Clone Starbucks",
    href: "https://sbucksdevleao.netlify.app/",
    label: {
      pt: "Estudo de front-end. Reprodução de layout para prática, sem vínculo com a Starbucks.",
      en: "Front-end study. A layout reproduction for practice, not affiliated with Starbucks.",
    },
    stack: ["HTML", "CSS", "JavaScript"],
  },
];

export const projectsSection = {
  title: { pt: "PROJETOS", en: "WORK" } satisfies I18n,
  sites: { pt: "Sites e portais", en: "Sites and portals" } satisfies I18n,
  sitesNote: { pt: "Todos no ar.", en: "All live." } satisfies I18n,
  studies: { pt: "Estudos", en: "Studies" } satisfies I18n,
  visit: { pt: "abrir o site", en: "open site" } satisfies I18n,
};

/* ============================================================
   PORTAL
   ============================================================ */

export const portal = {
  enter: {
    pt: "mas nem tudo que eu faço é trabalho",
    en: "but not everything I build is work",
  } satisfies I18n,
  exit: {
    pt: "voltando ao horário comercial",
    en: "back to business hours",
  } satisfies I18n,
};

/* ============================================================
   PLAYGROUND / SIDE QUESTS

   TODO — Leandro: trocar os três cards abaixo pelos experimentos reais.
   Cada card quer nome, uma linha de descrição e um link. Enquanto o
   `todo: true` estiver aqui, o card se mostra como rascunho na tela —
   de propósito, para não parecer conteúdo pronto.
   ============================================================ */

export type SideQuest = {
  id: string;
  title: I18n;
  body: I18n;
  href: string | null;
  accent: "neon" | "blue" | "pink";
};

export const playground = {
  title: { pt: "SIDE QUESTS", en: "SIDE QUESTS" } satisfies I18n,
  subtitle: {
    pt: "Os joguinhos que eu fiz aprendendo — todos jogáveis logo abaixo. Nenhum usa engine, e a IA entrou como par de programação, não como piloto.",
    en: "The little games I built while learning — all playable right below. No engine, and AI came in as a pair, not as the pilot.",
  } satisfies I18n,
  todoBadge: { pt: "jogar", en: "play" } satisfies I18n,
  catAlt: {
    pt: "Gatinho pixel batendo as patinhas no canto da seção.",
    en: "Pixel cat tapping its paws in the corner of the section.",
  } satisfies I18n,
  quests: [
    {
      id: "quest-cobrinha",
      title: { pt: "COBRINHA", en: "SNAKE" },
      body: {
        pt: "O primeiro. Aprendi aqui que jogo não pode andar por quadro: num monitor de 144Hz a cobra ficava o dobro mais rápida. Passo de tempo fixo resolveu — e essa lição vale para qualquer animação.",
        en: "The first one. Here I learnt a game can't move per frame: on a 144Hz monitor the snake ran twice as fast. A fixed time step fixed it — a lesson that holds for any animation.",
      },
      href: "#arcade",
      accent: "neon",
    },
    {
      id: "quest-memoria",
      title: { pt: "MEMORIA", en: "MEMORY" },
      body: {
        pt: "Parecia o mais simples e me ensinou sobre hidratação: embaralhar com Math.random no primeiro render dá ordens diferentes no servidor e no navegador, e o React reclama. O baralho passou a ser sorteado só no cliente.",
        en: "Looked like the easiest and taught me about hydration: shuffling with Math.random on first render gives different orders on server and client, and React complains. The deck is now drawn client-side only.",
      },
      href: "#arcade",
      accent: "blue",
    },
    {
      id: "quest-luta",
      title: { pt: "BRIGA DE RUA", en: "STREET BRAWL" },
      body: {
        pt: "Feito junto com IA, e o mais reescrito de todos. Começou como três botões de escolha; virou jogo quando entrou distância, alcance e reação — cuspe, cambaleio, queda. O que faz parecer luta não é o dano, é o que acontece depois dele.",
        en: "Built alongside AI, and the most rewritten of them all. It started as three choice buttons; it became a game when distance, range and reaction came in — spit, stagger, knockdown. What makes it read as a fight isn't the damage, it's what happens after it.",
      },
      href: "#arcade",
      accent: "pink",
    },
    {
      id: "quest-corrida",
      title: { pt: "FUGA NA PISTA", en: "LANE RUSH" },
      body: {
        pt: "Aqui aprendi a amarrar dificuldade e sensação na MESMA variável: a velocidade da pista governa as duas, então o jogo nunca fica difícil sem parecer mais rápido. E três vidas mudam mais o jogo do que qualquer ajuste de número.",
        en: "Here I learnt to tie difficulty and feel to the SAME variable: road speed drives both, so the game never gets harder without feeling faster. And three lives change the game more than any number tweak.",
      },
      href: "#arcade",
      accent: "neon",
    },
  ] satisfies SideQuest[],
};

/* ============================================================
   DEMOS — o que eu faço, demonstrado em vez de descrito
   ============================================================ */

export const demos = {
  titulo: { pt: "NA PRÁTICA", en: "IN PRACTICE" } satisfies I18n,
  lede: {
    pt: "Três coisas que eu faço todo dia. Em vez de descrever, deixei aqui funcionando — pode mexer.",
    en: "Three things I do every day. Instead of describing them, I left them running here — go ahead.",
  } satisfies I18n,

  sql: {
    numero: "01",
    titulo: { pt: "Análise de dados", en: "Data analysis" } satisfies I18n,
    lede: {
      pt: "Painel de uma carteira de nove clientes. Os KPIs, as barras e a rosca são derivados da tabela no momento do clique — nenhum número está escrito à mão.",
      en: "A dashboard over a nine-client portfolio. KPIs, bars and the donut are derived from the table at click time — no number is hard-coded.",
    } satisfies I18n,
    perguntas: [
      { pt: "vencido por região", en: "overdue by region" } satisfies I18n,
      { pt: "acima de 60 dias", en: "over 60 days" } satisfies I18n,
      { pt: "faixa de atraso", en: "ageing buckets" } satisfies I18n,
      { pt: "atraso médio", en: "average delay" } satisfies I18n,
    ],
    kpiCarteira: { pt: "carteira total", en: "total portfolio" } satisfies I18n,
    kpiAberto: { pt: "em aberto", en: "outstanding" } satisfies I18n,
    kpiCritico: { pt: "acima de 90 dias", en: "over 90 days" } satisfies I18n,
    kpiMedio: { pt: "atraso médio", en: "average delay" } satisfies I18n,
    resultado: { pt: "resultado", en: "result" } satisfies I18n,
    linhas: { pt: "linhas", en: "rows" } satisfies I18n,
    notaRosca: {
      pt: "Quase metade da carteira está vencida. É esse número que justifica o fluxo de cobrança da demo ao lado.",
      en: "Nearly half the portfolio is overdue. That number is what justifies the collection flow in the next demo.",
    } satisfies I18n,
    leitura: [
      {
        pt: "O Sudeste concentra o problema. Cobrança geral desperdiça esforço — a fila começa por região.",
        en: "The Southeast concentrates the problem. A blanket campaign wastes effort — the queue starts by region.",
      } satisfies I18n,
      {
        pt: "Quatro clientes carregam quase todo o valor vencido. Ligar para esses quatro rende mais que mil e-mails.",
        en: "Four clients carry nearly all the overdue value. Calling those four beats a thousand emails.",
      } satisfies I18n,
      {
        pt: "O balde de 90d+ é o que vira perda contábil. É a faixa que precisa de gente, não de automação.",
        en: "The 90d+ bucket is what becomes a write-off. That band needs a human, not automation.",
      } satisfies I18n,
      {
        pt: "Atraso médio alto numa região significa processo quebrado, não cliente ruim. Vale auditar a régua de cobrança de lá.",
        en: "A high average in one region means a broken process, not bad clients. Worth auditing the dunning rules there.",
      } satisfies I18n,
    ],
  },

  automacao: {
    numero: "02",
    titulo: { pt: "Automação", en: "Automation" } satisfies I18n,
    lede: {
      pt: "O fluxo de cobrança que eu monto no n8n, rodando aqui. Troque o cliente: o IF e o Filter ramificam de verdade, e o agente carrega modelo, memória e RAG pendurados nele — como no editor.",
      en: "The collections flow I build in n8n, running here. Switch clients: the IF and Filter really branch, and the agent carries model, memory and RAG hanging off it — just like the editor.",
    } satisfies I18n,
    tituloCanvas: { pt: "fluxo · cobrança automática", en: "flow · automated dunning" } satisfies I18n,
    rodar: { pt: "executar", en: "execute" } satisfies I18n,
    rodando: { pt: "executando…", en: "executing…" } satisfies I18n,
    barrouSelo: { pt: "barrado", en: "blocked" } satisfies I18n,
    logVazio: {
      pt: "// escolha um cliente e execute o fluxo",
      en: "// pick a client and execute the flow",
    } satisfies I18n,
    nos: {
      cron: { pt: "cron · todo dia às 9h", en: "cron · daily at 9am" } satisfies I18n,
      supabase: { pt: "supabase · get cobranças", en: "supabase · get invoices" } satisfies I18n,
      se: { pt: "if · boleto em aberto?", en: "if · invoice open?" } satisfies I18n,
      filtro: { pt: "filter · sem acordo ativo", en: "filter · no active plan" } satisfies I18n,
      agente: { pt: "ai agent · redigir cobrança", en: "ai agent · draft the dunning" } satisfies I18n,
      codigo: { pt: "code · formatar mensagem", en: "code · format message" } satisfies I18n,
      whatsapp: { pt: "whatsapp · enviar", en: "whatsapp · send" } satisfies I18n,
      log: { pt: "log · planilha + crm", en: "log · sheet + crm" } satisfies I18n,
    },
    log: {
      cron: { pt: "disparo agendado das 09:00", en: "scheduled 09:00 run" } satisfies I18n,
      supabase: { pt: "registro obtido:", en: "record fetched:" } satisfies I18n,
      seSim: {
        pt: "boleto EM ABERTO → segue pelo galho de cobrança",
        en: "invoice OPEN → continues down the dunning branch",
      } satisfies I18n,
      seNao: {
        pt: "boleto PAGO → nada a cobrar, fluxo encerra aqui",
        en: "invoice PAID → nothing to collect, flow ends here",
      } satisfies I18n,
      filtro: {
        pt: "sem acordo ativo e sem contestação → segue",
        en: "no active plan, no open dispute → passes",
      } satisfies I18n,
      barrado: {
        pt: "ACORDO EM ANDAMENTO → registro descartado, agente não roda",
        en: "PAYMENT PLAN ACTIVE → record dropped, the agent never runs",
      } satisfies I18n,
      agente: {
        pt: "agente buscou 3 interações no RAG e redigiu no tom do histórico",
        en: "agent pulled 3 interactions from RAG and wrote in the history's tone",
      } satisfies I18n,
      codigo: {
        pt: "mensagem formatada: nome curto, valor em R$, link da 2ª via",
        en: "message formatted: short name, BRL amount, invoice link",
      } satisfies I18n,
      whatsapp: { pt: "enviado ao responsável:", en: "sent to the contact:" } satisfies I18n,
      mensagem: {
        pt: "Oi! Passando pra lembrar do boleto que venceu. Precisa de uma segunda via?",
        en: "Hi! Just a reminder about the overdue invoice. Need a new copy?",
      } satisfies I18n,
      registrado: { pt: "linha gravada · fluxo concluído", en: "row written · flow complete" } satisfies I18n,
      registradoBarrado: {
        pt: "bloqueio registrado para auditoria · fluxo encerrado",
        en: "block logged for audit · flow ended",
      } satisfies I18n,
      encerrado: { pt: "nada a fazer · fluxo encerrado", en: "nothing to do · flow ended" } satisfies I18n,
    },
  },

  llm: {
    numero: "03",
    titulo: { pt: "Assistentes com LLM", en: "LLM assistants" } satisfies I18n,
    lede: {
      pt: "Escreva o que quiser. Ele lê o texto, extrai intenção, prazo e orçamento, e responde em cima disso — e se a confiança ficar abaixo do corte, se recusa a classificar.",
      en: "Type anything. It reads the text, extracts intent, deadline and budget, and answers from that — and if confidence falls below the cutoff, it refuses to classify.",
    } satisfies I18n,
    tituloChat: { pt: "assistente de triagem", en: "triage assistant" } satisfies I18n,
    vazio: {
      pt: "Escreva como se estivesse me chamando no WhatsApp. Tente citar prazo e valor — e depois tente sem, para ver a confiança cair.",
      en: "Write as if you were messaging me. Try mentioning a deadline and a budget — then try without, and watch the confidence drop.",
    } satisfies I18n,
    placeholder: { pt: "digite sua mensagem…", en: "type your message…" } satisfies I18n,
    enviar: { pt: "enviar", en: "send" } satisfies I18n,
    pensando: { pt: "processando…", en: "processing…" } satisfies I18n,
    escrevendo: { pt: "escrevendo…", en: "typing…" } satisfies I18n,
    online: { pt: "pronto para ler sua mensagem", en: "ready to read your message" } satisfies I18n,
    /* As quatro etapas que um assistente de produção executa antes de abrir a
       boca. Mostrá-las é o que separa esta demo de um "pensando…" genérico:
       a parte interessante do trabalho é justamente essa. */
    etapas: {
      ler: { pt: "lendo a mensagem", en: "reading the message" } satisfies I18n,
      extrair: {
        pt: "extraindo intenção, prazo e valor",
        en: "extracting intent, deadline and budget",
      } satisfies I18n,
      escopo: {
        pt: "checando se está no meu escopo",
        en: "checking whether it is in scope",
      } satisfies I18n,
      confianca: {
        pt: "medindo confiança da classificação",
        en: "measuring classification confidence",
      } satisfies I18n,
    },
    sugestoes: [
      {
        pt: "preciso de uma loja online até o fim do mês, tenho 10 mil",
        en: "I need an online store by month end, I have R$10k",
      } satisfies I18n,
      { pt: "queria saber sobre os serviços", en: "I'd like to know about your services" } satisfies I18n,
      {
        pt: "quero automatizar uma planilha que preencho toda segunda",
        en: "I want to automate a spreadsheet I fill every Monday",
      } satisfies I18n,
      { pt: "meu ERP da Totvs parou", en: "my Totvs ERP stopped working" } satisfies I18n,
    ],
    saidaTitulo: { pt: "saída estruturada", en: "structured output" } satisfies I18n,
    saidaVazia: {
      pt: "// a saída vem como JSON, não como parágrafo",
      en: "// output comes as JSON, not as a paragraph",
    } satisfies I18n,
    confianca: { pt: "confiança · corte em 55%", en: "confidence · cutoff at 55%" } satisfies I18n,
    avisoHumano: {
      pt: "Abaixo do corte: o assistente NÃO classifica e devolve para uma pessoa. É este campo que separa demo de produção.",
      en: "Below the cutoff: the assistant does NOT classify and hands it to a human. This field is what separates a demo from production.",
    } satisfies I18n,
    avisoOk: {
      pt: "Acima do corte: dá para seguir sem gente no meio.",
      en: "Above the cutoff: safe to proceed without a human in the loop.",
    } satisfies I18n,
    nota: {
      pt: "Sem chamada de API: chave de modelo em site estático é chave exposta. A extração roda por regra no seu navegador — que é exatamente a camada de triagem que existe ANTES do modelo num assistente de produção, para não gastar chamada com o que a regra já resolve.",
      en: "No API call: a model key in a static site is an exposed key. Extraction runs rule-based in your browser — exactly the triage layer that sits BEFORE the model in a production assistant, so you don't spend a call on what rules already solve.",
    } satisfies I18n,
  },
};

/* ============================================================
   ARCADE — quatro joguinhos de verdade dentro do mundo pixel
   ============================================================ */

export const arcade = {
  titulo: { pt: "ARCADE", en: "ARCADE" } satisfies I18n,
  subtitulo: {
    pt: "Quatro jogos meus: dois clássicos escritos aqui mesmo, uma corrida em 3D e a tela de luta do jogo que estou desenvolvendo.",
    en: "Four games of mine: two classics written right here, a 3D race, and the fight screen from the game I'm building.",
  } satisfies I18n,
  jogar: { pt: "jogar", en: "play" } satisfies I18n,
  denovo: { pt: "de novo", en: "again" } satisfies I18n,
  pontos: { pt: "pontos", en: "score" } satisfies I18n,
  recorde: { pt: "recorde", en: "best" } satisfies I18n,
  snake: {
    nome: { pt: "COBRINHA", en: "SNAKE" } satisfies I18n,
    como: {
      pt: "Setas, WASD ou arraste o dedo.",
      en: "Arrows, WASD or swipe.",
    } satisfies I18n,
    fim: { pt: "FIM DE JOGO —", en: "GAME OVER —" } satisfies I18n,
    regra: {
      pt: "Acelera a cada fruta, até um piso. Sem teto, em quinze frutas vira ingovernável.",
      en: "Speeds up with every fruit, down to a floor. Uncapped, fifteen fruits in it is unplayable.",
    } satisfies I18n,
  },
  memoria: {
    nome: { pt: "MEMORIA", en: "MEMORY" } satisfies I18n,
    como: {
      pt: "Ache os seis pares em menos jogadas possível.",
      en: "Find the six pairs in as few moves as you can.",
    } satisfies I18n,
    carta: { pt: "carta virada para baixo", en: "face-down card" } satisfies I18n,
    jogadas: { pt: "jogadas", en: "moves" } satisfies I18n,
    venceu: { pt: "ACHOU TODOS!", en: "ALL PAIRS FOUND!" } satisfies I18n,
    regra: {
      pt: "Seis pares. Menos que isso é trivial, mais que isso vira tarefa — a graça é durar um minuto.",
      en: "Six pairs. Fewer is trivial, more becomes a chore — the point is to last a minute.",
    } satisfies I18n,
  },
  luta: {
    nome: { pt: "BRIGA DE RUA", en: "STREET BRAWL" } satisfies I18n,
    como: {
      pt: "← → anda · J soco · K chute · S defesa.",
      en: "← → move · J punch · K kick · S guard.",
    } satisfies I18n,
    foco: {
      pt: "Clique na tela da luta para os comandos irem para o jogo.",
      en: "Click the fight screen so the keys go to the game.",
    } satisfies I18n,
    controles: { pt: "controles da luta", en: "fight controls" } satisfies I18n,
    telaCheia: { pt: "tela cheia", en: "fullscreen" } satisfies I18n,
    regra: {
      pt: "A tela de luta do jogo que estou desenvolvendo, rodando aqui dentro com os sprites dele. O golpe não acerta porque você apertou: acerta se a distância estiver certa.",
      en: "The fight screen from the game I'm building, running right here with its own sprites. A strike doesn't land because you pressed the key: it lands if the distance is right.",
    } satisfies I18n,
  },
  corrida: {
    nome: { pt: "CORRIDA NOTURNA", en: "NIGHT CIRCUIT" } satisfies I18n,
    como: {
      pt: "↑ acelera · ↓ freia · ← → vira (ou WASD). Três voltas contra três rivais.",
      en: "↑ throttle · ↓ brake · ← → steer (or WASD). Three laps against three rivals.",
    } satisfies I18n,
    volta: { pt: "volta", en: "lap" } satisfies I18n,
    posicao: { pt: "posição", en: "position" } satisfies I18n,
    melhorVolta: { pt: "melhor volta", en: "best lap" } satisfies I18n,
    tempo: { pt: "tempo", en: "time" } satisfies I18n,
    carregando: { pt: "montando a pista…", en: "building the track…" } satisfies I18n,
    largada: { pt: "VAI!", en: "GO!" } satisfies I18n,
    chegada: { pt: "CHEGOU EM", en: "FINISHED" } satisfies I18n,
    acelerar: { pt: "acelerar", en: "throttle" } satisfies I18n,
    frear: { pt: "frear", en: "brake" } satisfies I18n,
    esquerda: { pt: "virar à esquerda", en: "steer left" } satisfies I18n,
    direita: { pt: "virar à direita", en: "steer right" } satisfies I18n,
    regra: {
      pt: "3D de verdade, em three.js. A pista é uma curva fechada, os rivais tiram o pé antes da curva, e a grama cobra caro de quem corta caminho.",
      en: "Proper 3D, in three.js. The track is a closed curve, rivals lift before the corners, and the grass charges dearly for shortcuts.",
    } satisfies I18n,
  },
};


/* ============================================================
   FORMAÇÃO — acadêmico e certificados

   Os arquivos estão em /public. Certificado é prova, e prova se MOSTRA:
   por isso cada um tem imagem, carga horária e data, e não só o nome do
   curso numa lista.
   ============================================================ */

export type Academico = {
  id: string;
  nivel: I18n;
  curso: I18n;
  instituicao: string;
  /* Traduzido porque tem nome de mês: "jun/2026" no meio de uma página em
     inglês entrega que o conteúdo não foi realmente traduzido, foi copiado. */
  periodo: I18n;
  emCurso?: boolean;
  arquivo?: string;
};

export type Certificado = {
  id: string;
  curso: I18n;
  instituicao: string;
  /**
   * Carga horária ou tipo da credencial, e quando foi.
   *
   * Traduzidos, mesmo quando os dois idiomas dizem a mesma coisa ("120h").
   * Dois destes NÃO dizem: "Certificação Técnica" e "1º sem. 2025" apareciam
   * crus na página em inglês. Manter o par como texto solto é garantir que o
   * próximo certificado com rótulo em português repita o vazamento.
   */
  carga: I18n;
  data: I18n;
  imagem: string;
  /**
   * O que o curso cobre, em uma ou duas frases.
   *
   * Nenhum destes certificados traz ementa, então a descrição fala do
   * ESCOPO e do uso — não inventa lista de módulos que ninguém pode
   * conferir contra o papel que está logo ali na imagem.
   */
  descricao: I18n;
};

export const formacao = {
  titulo: { pt: "FORMAÇÃO", en: "EDUCATION" } satisfies I18n,
  lede: {
    pt: "Onde eu aprendi o que está no resto desta página — e o que estou aprendendo agora.",
    en: "Where I learnt what's on the rest of this page — and what I'm learning right now.",
  } satisfies I18n,
  tituloCertificados: { pt: "certificados", en: "certificates" } satisfies I18n,
  emCurso: { pt: "em andamento", en: "in progress" } satisfies I18n,
  concluido: { pt: "concluído", en: "completed" } satisfies I18n,
  verDiploma: { pt: "ver diploma", en: "view diploma" } satisfies I18n,
  fechar: { pt: "fechar", en: "close" } satisfies I18n,

  academico: [
    {
      id: "pos-devops",
      nivel: { pt: "Pós-graduação", en: "Postgraduate" },
      curso: { pt: "Engenharia DevOps", en: "DevOps Engineering" },
      instituicao: "Anhanguera",
      /* "previsto" fica: data de término no futuro sem ressalva lê como
         curso já concluído, e é o tipo de detalhe que derruba a confiança
         inteira numa checagem de dois minutos. */
      periodo: {
        pt: "ago/2026 — jun/2027 (previsto)",
        en: "Aug 2026 — Jun 2027 (expected)",
      },
      emCurso: true,
    },
    {
      id: "ads",
      nivel: { pt: "Graduação", en: "Undergraduate" },
      curso: {
        pt: "Tecnólogo em Análise e Desenvolvimento de Sistemas",
        en: "Technologist in Systems Analysis and Development",
      },
      instituicao: "Anhanguera",
      periodo: { pt: "2023 — jun/2026", en: "2023 — Jun 2026" },
      arquivo: "/DiplomaDigital.pdf",
    },
  ] satisfies Academico[],

  certificados: [
    {
      id: "rag",
      curso: {
        pt: "Especialista em Automação & IA",
        en: "Automation & AI Specialist",
      },
      instituicao: "NoCode StartUp",
      carga: { pt: "Certificação Técnica", en: "Technical Certification" },
      data: { pt: "07/2025", en: "Jul 2025" },
      imagem: "/agenteIA.png",
      descricao: {
        pt: "Desenvolvimento de agentes autônomos, fine-tuning de LLMs e orquestração com n8n. Formação “Converse com PDF, Planilha e Arquivos — RAG com n8n”: é daqui que vem o agente com base vetorial que aparece na demo de automação desta página.",
        en: "Building autonomous agents, fine-tuning LLMs and orchestrating with n8n. From the “Chat with PDFs, Spreadsheets and Files — RAG with n8n” track: this is where the vector-store agent in this page's automation demo comes from.",
      },
    },
    {
      id: "web",
      curso: {
        pt: "Desenvolvimento Web Completo — 20 cursos + 20 projetos",
        en: "Complete Web Development — 20 courses + 20 projects",
      },
      instituicao: "Udemy",
      carga: { pt: "120h", en: "120h" },
      data: { pt: "12/2025", en: "Dec 2025" },
      imagem: "/cert-web.png",
      descricao: {
        pt: "O curso de base, feito projeto a projeto em vez de módulo a módulo: HTML, CSS, JavaScript e o lado servidor, vinte entregas do começo ao fim. Foi aqui que a parte de front deixou de ser tentativa e erro.",
        en: "The foundation course, built project by project rather than module by module: HTML, CSS, JavaScript and the server side, twenty deliveries start to finish. This is where front-end stopped being trial and error.",
      },
    },
    {
      id: "python",
      curso: {
        pt: "Análise de Dados com Python",
        en: "Data Analysis with Python",
      },
      instituicao: "Trilhas de Carreira",
      carga: { pt: "40h", en: "40h" },
      data: { pt: "1º sem. 2025", en: "H1 2025" },
      imagem: "/cert-web1.png",
      descricao: {
        pt: "Leitura, limpeza e agregação de dados em Python — o caminho do arquivo bruto até a resposta. É o que eu abro quando a pergunta não cabe num painel e precisa de código.",
        en: "Reading, cleaning and aggregating data in Python — the path from raw file to answer. It's what I reach for when the question doesn't fit a dashboard and needs code.",
      },
    },
    {
      id: "powerbi-intro",
      curso: {
        pt: "Introdução à Análise de Dados — Microsoft Power BI",
        en: "Introduction to Data Analysis — Microsoft Power BI",
      },
      instituicao: "Fundação Bradesco · Microsoft",
      carga: { pt: "5h", en: "5h" },
      data: { pt: "04/2025", en: "Apr 2025" },
      imagem: "/cert-web3.png",
      descricao: {
        pt: "A porta de entrada: conectar a fonte, montar o modelo e publicar o primeiro relatório. Curto, e é o que separa quem monta gráfico de quem monta modelo.",
        en: "The way in: connect the source, build the model, publish the first report. Short, and it's what separates making a chart from making a model.",
      },
    },
    {
      id: "powerbi",
      curso: {
        pt: "Análise de Dados no Power BI",
        en: "Data Analysis in Power BI",
      },
      instituicao: "Fundação Bradesco · Microsoft",
      carga: { pt: "4h", en: "4h" },
      data: { pt: "04/2025", en: "Apr 2025" },
      imagem: "/cert-web2.png",
      descricao: {
        pt: "A parte aplicada do anterior: transformar os dados antes de carregar, criar medidas e montar o relatório que alguém vai usar para decidir alguma coisa.",
        en: "The applied half of the one above: transform the data before loading, write measures, and assemble the report someone will actually decide from.",
      },
    },
  ] satisfies Certificado[],
};

/* ============================================================
   CONTATO
   ============================================================ */

export const contact = {
  title: { pt: "VAMOS CONSTRUIR JUNTOS", en: "LET'S BUILD THE FUTURE" } satisfies I18n,
  lede: {
    pt: "Conte o problema. Se eu não for a pessoa certa, eu digo.",
    en: "Tell me the problem. If I'm not the right person, I'll say so.",
  } satisfies I18n,
  form: {
    name: { pt: "Nome", en: "Name" } satisfies I18n,
    email: { pt: "E-mail", en: "Email" } satisfies I18n,
    message: { pt: "Mensagem", en: "Message" } satisfies I18n,
    send: { pt: "Enviar mensagem", en: "Send message" } satisfies I18n,
    sending: { pt: "Enviando…", en: "Sending…" } satisfies I18n,
    sent: { pt: "Recebido. Respondo em breve.", en: "Got it. I'll reply soon." } satisfies I18n,
    failed: {
      pt: "Não consegui enviar. Tente o WhatsApp ou o e-mail direto.",
      en: "Couldn't send it. Try WhatsApp or email me directly.",
    } satisfies I18n,
    errors: {
      name: { pt: "Como você se chama?", en: "What's your name?" } satisfies I18n,
      email: {
        pt: "Preciso de um e-mail válido para responder.",
        en: "I need a valid email to reply.",
      } satisfies I18n,
      message: {
        pt: "Escreva algo, mesmo que curto.",
        en: "Write something, even if it's short.",
      } satisfies I18n,
    },
  },
  channels: [
    { id: "email", label: "E-mail", value: identity.email, href: `mailto:${identity.email}` },
    { id: "github", label: "GitHub", value: "devLeao", href: identity.github },
    { id: "linkedin", label: "LinkedIn", value: "in/devleao", href: identity.linkedin },
    { id: "whatsapp", label: "WhatsApp", value: identity.phone, href: identity.whatsapp },
  ],
};

/* ============================================================
   MOVIMENTO — convite para quem tem a preferência do sistema ligada
   ============================================================ */

export const motion = {
  conviteTitulo: {
    pt: "Seu sistema pediu menos animação.",
    en: "Your system asked for less motion.",
  } satisfies I18n,
  conviteCorpo: {
    pt: "Este site tem bastante. Estou respeitando a sua configuração — mas se ela estiver ligada sem querer, dá para ver a versão completa.",
    en: "This site has plenty of it. I'm respecting your setting — but if it's on by accident, you can see the full version.",
  } satisfies I18n,
  conviteLigar: { pt: "ver com animação", en: "show motion" } satisfies I18n,
  conviteManter: { pt: "manter assim", en: "keep it calm" } satisfies I18n,
  rodapeLigar: { pt: "ativar animações", en: "enable motion" } satisfies I18n,
  rodapeDesligar: { pt: "reduzir animações", en: "reduce motion" } satisfies I18n,
};

export const footer = {
  rights: { pt: "Todos os direitos reservados.", en: "All rights reserved." } satisfies I18n,
  builtWith: {
    pt: "Next.js, Three.js e GSAP. Sem template.",
    en: "Next.js, Three.js and GSAP. No template.",
  } satisfies I18n,
  catAlt: {
    pt: "Gatinho pixel olhando para cima, no rodapé.",
    en: "Pixel cat looking up, in the footer.",
  } satisfies I18n,
};

/* ============================================================
   META
   ============================================================ */

export const meta = {
  title: {
    pt: "Leandro Leão — Full Stack Developer & Analista de Dados",
    en: "Leandro Leão — Full Stack Developer & Data Analyst",
  } satisfies I18n,
  description: {
    pt: "Construo o sistema e leio o dado que ele gera. Automação com n8n, agentes com RAG, painéis que sustentam decisão — e aplicações no ar para clientes reais.",
    en: "I build the system and read the data it produces. n8n automation, RAG agents, dashboards that hold up a decision — and apps live for real clients.",
  } satisfies I18n,
};

/* ============================================================
   SOM — rótulos compartilhados entre teclado e portal
   ============================================================ */

export const sound = {
  on: { pt: "som ligado", en: "sound on" } satisfies I18n,
  off: { pt: "som mudo", en: "sound muted" } satisfies I18n,
  label: { pt: "Alternar som do site", en: "Toggle site sound" } satisfies I18n,
};
