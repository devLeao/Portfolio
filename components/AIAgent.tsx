"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Terminal, Cpu, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

// --- TIPO DA MENSAGEM ---
type Message = {
  role: "user" | "assistant";
  content: string;
  thinking?: string[]; // Logs do "raciocínio"
};

// --- CÉREBRO FALSO (MOCK BRAIN) ---
const MOCK_RESPONSES = [
  {
    keywords: ["stack", "tecnologia", "linguagem", "ferramenta", "skills", "python", "javascript"],
    thinking: [
      "> analisando_perfil_dev...",
      "> consultando_banco_skills(SQL)...",
      "> filtrando_stack_principal...",
      "> gerando_resposta_markdown..."
    ],
    response: "Minha stack principal é focada em **Automação e Dados**. No backend, sou especialista em **Python** e **Node.js** para construção de agentes. Utilizo **n8n** para orquestração de fluxos complexos e **PostgreSQL** como banco de dados principal. No frontend, como você pode ver neste site, domino **React/Next.js** e **Tailwind CSS**."
  },
  {
    keywords: ["projeto", "portfolio", "trabalho", "case", "cadu", "gabi"],
    thinking: [
      "> acessando_diretorio_projetos...",
      "> carregando_metadata_cases...",
      "> recuperando_logs_backend...",
      "> formatando_saida..."
    ],
    response: "Tenho experiência prática em casos reais. Destaque para o sistema da **Barbearia Cadu Barber**, onde implementei lógica de *Blacklist* e taxas automáticas, e o redesign para **Gabriela Dias Nutrição**, focado em SEO e performance. Além disso, crio agentes de IA para atendimento via WhatsApp usando a **Evolution API**."
  },
  {
    keywords: ["contato", "email", "contratar", "freela", "linkedin", "falar"],
    thinking: [
      "> iniciando_protocolo_handshake...",
      "> descriptografando_dados_contato...",
      "> verificando_disponibilidade_agenda..."
    ],
    response: "Estou disponível para novos projetos e consultorias! Você pode me chamar diretamente no **WhatsApp** ou enviar um **E-mail** através dos botões na seção de contato abaixo. Vamos construir algo inteligente juntos?"
  },
  {
    keywords: ["ola", "oi", "bom dia", "tarde", "noite", "hello"],
    thinking: [
      "> detectando_idioma...",
      "> carregando_persona_friendly...",
      "> system_check: online"
    ],
    response: "Olá! Sou o Gêmeo Digital do Leandro. Fui treinado com os dados profissionais dele. Você pode me perguntar sobre **Projetos**, **Habilidades Técnicas** ou como entrar em **Contato**."
  }
];

// Resposta Padrão (Fallback)
const DEFAULT_RESPONSE = {
  thinking: [
    "> input_desconhecido...",
    "> tentando_inferencia_contextual...",
    "> recorrendo_resposta_generica..."
  ],
  response: "Interessante pergunta. Como sou uma versão de demonstração treinada em um contexto específico, sugiro que pergunte sobre **Minha Stack**, **Meus Projetos** ou **Como me contratar**. Tente clicar em uma das sugestões abaixo!"
};

export default function AIAgent() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "assistant", 
      content: "System Online. Sou o Gêmeo Digital. Pergunte sobre Skills, Projetos ou Experiência.",
      thinking: ["> system_boot...", "> loading_context: developer_profile"]
    }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  
  // MUDANÇA AQUI: Referência para a área de scroll, não para o fim da mensagem
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll apenas interno
  useEffect(() => {
    if (scrollAreaRef.current) {
      // Isso rola apenas a DIV do chat para o fundo, sem mexer na página
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSend = async (textOverride?: string) => {
    const text = textOverride || input;
    if (!text.trim()) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setIsThinking(true);

    setTimeout(() => {
      const lowerInput = text.toLowerCase();
      const match = MOCK_RESPONSES.find(r => r.keywords.some(k => lowerInput.includes(k))) || DEFAULT_RESPONSE;

      setMessages((prev) => [...prev, { 
        role: "assistant", 
        content: match.response,
        thinking: match.thinking
      }]);
      setIsThinking(false);
    }, 2500); 
  };

  return (
    <section className="w-full max-w-4xl mx-auto p-4 relative z-20">
      <div className="border border-gray-800 bg-black/80 backdrop-blur-xl rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,255,65,0.05)] flex flex-col h-[600px]">
        
        {/* Header do Chat */}
        <div className="bg-gray-900/50 p-4 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="relative">
                    <Terminal size={18} className="text-[#00ff41]" />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-[#00ff41] rounded-full animate-pulse shadow-[0_0_10px_#00ff41]"></span>
                </div>
                <span className="text-xs font-mono text-gray-400">
                    agent_status: <span className="text-[#00ff41]">connected</span>
                </span>
            </div>
            <div className="flex gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
            </div>
        </div>

        {/* Área de Mensagens (Com a Ref de Scroll aqui) */}
        <div 
            ref={scrollAreaRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 font-mono text-sm scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent"
        >
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              
              {/* Avatar */}
              <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 border ${
                  msg.role === "assistant" 
                  ? "bg-[#00ff41]/10 border-[#00ff41]/30 text-[#00ff41]" 
                  : "bg-purple-500/10 border-purple-500/30 text-purple-400"
              }`}>
                {msg.role === "assistant" ? <Bot size={18} /> : <User size={18} />}
              </div>

              {/* Balão de Mensagem */}
              <div className="max-w-[85%] space-y-2">
                
                {/* --- LOGS --- */}
                {msg.role === "assistant" && msg.thinking && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="text-xs font-mono text-gray-500 bg-black/50 border-l-2 border-gray-800 pl-3 py-1 mb-2 space-y-1"
                    >
                        {msg.thinking.map((log, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <ChevronRight size={10} className="text-gray-600" />
                                <span>{log}</span>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* Conteúdo Real */}
                <div className={`p-4 rounded-lg leading-relaxed ${
                    msg.role === "assistant" 
                    ? "text-gray-200 border border-gray-800 bg-[#111]" 
                    : "bg-[#00ff41]/10 text-[#00ff41] border border-[#00ff41]/20"
                }`}>
                    <p dangerouslySetInnerHTML={{ 
                        __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<span class="text-white font-bold">$1</span>') 
                    }} />
                </div>
              </div>
            </div>
          ))}

          {/* Animação de Processando */}
          {isThinking && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="flex gap-4"
              >
                  <div className="w-8 h-8 rounded bg-[#00ff41]/10 border border-[#00ff41]/30 text-[#00ff41] flex items-center justify-center">
                      <Bot size={18} />
                  </div>
                  <div className="bg-black/50 border border-gray-800 rounded-lg p-3 flex items-center gap-3">
                      <Cpu size={16} className="text-[#00ff41] animate-spin-slow" />
                      <div className="text-xs text-gray-400 font-mono">
                          <span className="animate-pulse">processando_contexto...</span>
                      </div>
                  </div>
              </motion.div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-800 bg-[#050505]">
          
          {/* Sugestões Rápidas */}
          {!isThinking && messages.length < 4 && (
             <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                <button onClick={() => handleSend("Quais tecnologias você usa?")} className="text-xs font-mono border border-gray-700 hover:border-[#00ff41] text-gray-400 hover:text-[#00ff41] px-3 py-1.5 rounded-full transition-colors whitespace-nowrap bg-black">
                    🛠️ Minha Stack
                </button>
                <button onClick={() => handleSend("Me fale sobre seus projetos reais")} className="text-xs font-mono border border-gray-700 hover:border-[#00ff41] text-gray-400 hover:text-[#00ff41] px-3 py-1.5 rounded-full transition-colors whitespace-nowrap bg-black">
                    🚀 Projetos Reais
                </button>
                <button onClick={() => handleSend("Como posso entrar em contato?")} className="text-xs font-mono border border-gray-700 hover:border-[#00ff41] text-gray-400 hover:text-[#00ff41] px-3 py-1.5 rounded-full transition-colors whitespace-nowrap bg-black">
                    📬 Contato
                </button>
             </div>
          )}

          <div className="flex gap-2 items-center bg-[#0a0a0a] border border-gray-800 rounded-lg px-4 py-3 focus-within:border-[#00ff41]/50 transition-colors">
            <span className="text-[#00ff41] font-bold animate-pulse">{`>`}</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isThinking && handleSend()}
              placeholder={isThinking ? "Aguarde o processamento..." : "Digite um comando ou use as sugestões..."}
              disabled={isThinking}
              className="flex-1 bg-transparent border-none outline-none text-gray-200 font-mono placeholder:text-gray-700 disabled:opacity-50"
            />
            <button 
                onClick={() => handleSend()} 
                disabled={isThinking || !input.trim()}
                className="text-gray-500 hover:text-[#00ff41] disabled:opacity-30 disabled:hover:text-gray-500 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}