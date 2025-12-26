"use client";
import { motion } from "framer-motion";
import { ExternalLink, Github, Terminal, Cpu } from "lucide-react";

// Dados dos Projetos
const projects = [
  {
    title: "SaaS Agendamento Inteligente",
    client: "Cadu Barber",
    description: "Sistema de gestão para barbearias com lógica complexa de negócios: taxas automáticas para no-show, bloqueio de clientes (blacklist) e gestão de horários variáveis.",
    tags: ["React", "Node.js", "PostgreSQL", "Business Logic"],
    image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=2074&auto=format&fit=crop", 
    link: "https://cadubarber.com.br/", // Link Adicionado
    logs: [
      "> verificando_disponibilidade...",
      "[LÓGICA] Cliente detectado na Blacklist? FALSE",
      "[REGRA] Dia de semana: Fechamento às 20h",
      "[CÁLCULO] Taxa de ausência aplicada: 0%",
      "> agendamento_confirmado_db (ID: #9021)"
    ]
  },
  {
    title: "Agente de IA e automação de tarefas", // Título atualizado
    client: "Evolution API Integrations",
    description: "Automação de atendimento via WhatsApp utilizando LLMs. O sistema processa áudio e texto, consulta base de conhecimento e responde clientes automaticamente.",
    tags: ["n8n", "OpenAI API", "Docker", "Evolution API"],
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2070&auto=format&fit=crop",
    link: null, // Sem link = Sem botão "Ver Site"
    logs: [
      "> webhook_whatsapp_recebido...",
      "[AUDIO] Transcrição Whisper: 'Quero marcar hora'",
      "[RAG] Consultando horários no Supabase...",
      "[LLM] Gerando resposta humanizada (GPT-4o)",
      "> mensagem_enviada_sucesso"
    ]
  },
  {
    title: "Landing Page Otimizada",
    client: "Gabriela Dias Nutrição",
    description: "Redesign completo focado em conversão e performance. Interface moderna com Dark Mode e carregamento ultra-rápido para retenção de leads.",
    tags: ["Next.js", "Tailwind", "Framer Motion", "UX/UI"],
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2053&auto=format&fit=crop",
    link: "https://lpgabidiasnut.netlify.app/", // Link Adicionado
    logs: [
      "> iniciando_renderizacao_ssr...",
      "[SEO] Meta tags otimizadas geradas",
      "[PERFORMANCE] LCP (Large Contentful Paint): 0.8s",
      "[ANALYTICS] Evento de conversão disparado",
      "> interface_carregada_100%"
    ]
  }
];

export default function Projects() {
  return (
    <section className="py-24 px-4 bg-black/40 backdrop-blur-sm relative border-t border-gray-900">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Cabeçalho da Seção */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-gray-800 pb-6">
            <div className="space-y-2">
                <h2 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
                    <Cpu className="text-[#00ff41]" />
                    Case Studies
                </h2>
                <p className="text-gray-400 font-mono text-sm max-w-xl">
                    Projetos onde a lógica de dados encontra a interface do usuário.
                    Passe o mouse para ver o <span className="text-[#00ff41]">backend log</span>.
                </p>
            </div>
            <div className="text-xs font-mono text-gray-500">
                total_projects_loaded: {projects.length}
            </div>
        </div>

        {/* Grid de Projetos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative h-[450px] bg-[#0a0a0a] border border-gray-800 rounded-xl overflow-hidden hover:border-[#00ff41]/50 transition-colors"
                >
                    {/* --- CAMADA 1: Interface (Imagem e Texto) --- */}
                    <div className="absolute inset-0 z-20 flex flex-col transition-transform duration-500 group-hover:-translate-y-[60%] bg-[#0a0a0a]">
                        {/* Imagem */}
                        <div className="h-48 w-full overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent z-10" />
                            <img 
                                src={project.image} 
                                alt={project.title} 
                                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                            />
                        </div>
                        
                        {/* Conteúdo Visível */}
                        <div className="p-6 space-y-4 flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-xs font-mono text-[#00ff41] mb-1 block">{project.client}</span>
                                    <h3 className="text-xl font-bold text-white leading-tight">{project.title}</h3>
                                </div>
                                {/* Se tiver link, mostra ícone de link externo */}
                                {project.link && (
                                    <a href={project.link} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink size={18} className="text-gray-500 hover:text-white transition-colors" />
                                    </a>
                                )}
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">
                                {project.description}
                            </p>
                            <div className="flex flex-wrap gap-2 pt-2">
                                {project.tags.map(tag => (
                                    <span key={tag} className="text-[10px] font-mono border border-gray-800 bg-gray-900/50 text-gray-300 px-2 py-1 rounded">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* --- CAMADA 2: O Backend (Terminal Escondido) --- */}
                    <div className="absolute inset-0 z-10 pt-[180px] p-6 bg-black flex flex-col justify-end pb-6">
                        <div className="border-t border-[#00ff41]/20 pt-4 h-full flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-3 text-[#00ff41] text-xs font-mono">
                                    <Terminal size={14} />
                                    <span>server_logs.txt</span>
                                </div>
                                <div className="font-mono text-xs space-y-2 text-gray-400">
                                    {project.logs.map((log, i) => (
                                        <p key={i} className="truncate">
                                            <span className="text-gray-600 mr-2">{i + 1}</span>
                                            {log.startsWith('>') ? <span className="text-[#00ff41]">{log}</span> : log}
                                        </p>
                                    ))}
                                    <p className="animate-pulse text-[#00ff41]">_</p>
                                </div>
                            </div>
                            
                            <div className="mt-4 flex gap-3">
                                <button className="flex-1 py-2 border border-gray-700 hover:border-white text-xs font-mono text-white rounded transition-colors flex items-center justify-center gap-2">
                                    <Github size={14} /> Código
                                </button>
                                
                                {/* Lógica do Botão VER SITE: Só aparece se 'link' existir */}
                                {project.link && (
                                    <a 
                                        href={project.link} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex-1 py-2 bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/20 hover:bg-[#00ff41] hover:text-black text-xs font-mono rounded transition-all font-bold flex items-center justify-center cursor-pointer"
                                    >
                                        Ver Site
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                </motion.div>
            ))}
        </div>

      </div>
    </section>
  );
}   