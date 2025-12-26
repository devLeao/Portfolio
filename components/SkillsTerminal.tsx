"use client";
import { useState } from "react";
import { Database, Layout, Terminal } from "lucide-react";

export default function SkillsTerminal() {
  const [activeTab, setActiveTab] = useState<"data" | "web">("data");

  return (
   <section className="py-24 px-4 bg-transparent">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Título da Seção */}
        <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
                <span className="text-neon-green">Stack</span> Tecnológica
            </h2>
            <p className="text-gray-400 font-mono text-sm">Selecione o ambiente para visualizar:</p>
        </div>

        {/* O Terminal Container */}
        <div className="bg-[#0f0f0f] rounded-lg border border-gray-800 overflow-hidden shadow-2xl">
            
            {/* Abas do Terminal */}
            <div className="flex border-b border-gray-800 bg-[#1a1a1a]">
                <button 
                    onClick={() => setActiveTab("data")}
                    className={`flex items-center gap-2 px-6 py-3 font-mono text-sm transition-colors ${activeTab === "data" ? "bg-[#0f0f0f] text-neon-green border-t-2 border-neon-green" : "text-gray-500 hover:text-gray-300 hover:bg-[#252525]"}`}
                >
                    <Database size={16} />
                    database_skills.sql
                </button>
                <button 
                    onClick={() => setActiveTab("web")}
                    className={`flex items-center gap-2 px-6 py-3 font-mono text-sm transition-colors ${activeTab === "web" ? "bg-[#0f0f0f] text-blue-400 border-t-2 border-blue-400" : "text-gray-500 hover:text-gray-300 hover:bg-[#252525]"}`}
                >
                    <Layout size={16} />
                    frontend_interface.jsx
                </button>
            </div>

            {/* Conteúdo do Terminal */}
            <div className="p-6 md:p-8 font-mono text-sm md:text-base overflow-x-auto h-[400px] custom-scrollbar">
                
                {/* --- CONTEÚDO TAB 1: DADOS (SQL) --- */}
                {activeTab === "data" && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="text-gray-500">// Consultando banco de dados de competências...</div>
                        <div className="text-neon-green">
                            <span className="text-purple-400">SELECT</span> skill, nivel, aplicacao 
                            <span className="text-purple-400"> FROM</span> skills_db 
                            <span className="text-purple-400"> WHERE</span> category = <span className="text-yellow-300">'DATA_AI'</span>;
                        </div>
                        
                        <div className="text-gray-300 mt-4 whitespace-pre">
{`+----------------+--------------+---------------------------+
| Skill          | Nivel        | Aplicação Prática         |
+----------------+--------------+---------------------------+
| Python         | Avançado     | Scripts, Automação, ETL   |
| SQL (Postgres) | Especialista | Queries Complexas, Views  |
| OpenAI API     | Avançado     | Criação de Agentes, RAG   |
| n8n / Zapier   | Especialista | Workflow Automation       |
| LangChain      | Intermediário| Orquestração de LLMs      |
| Docker         | Avançado     | Deploy de Containers      |
+----------------+--------------+---------------------------+
`}
                        </div>
                        <div className="text-gray-500 mt-4">
                            <span className="text-neon-green">root@portfolio:~$</span> <span className="animate-pulse">_</span>
                        </div>
                    </div>
                )}

                {/* --- CONTEÚDO TAB 2: WEB (JS) --- */}
                {activeTab === "web" && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="text-gray-500">// Interface moderna para consumir os dados</div>
                        
                        <div className="text-blue-300">
                            <span className="text-purple-400">import</span> React <span className="text-purple-400">from</span> <span className="text-green-400">'react'</span>;<br/>
                            <span className="text-purple-400">import</span> NextJS <span className="text-purple-400">from</span> <span className="text-green-400">'next'</span>;<br/>
                            <span className="text-purple-400">import</span> Tailwind <span className="text-purple-400">from</span> <span className="text-green-400">'tailwindcss'</span>;
                        </div>

                        <div className="pl-4 border-l-2 border-gray-800 space-y-2 mt-4">
                            <p className="text-gray-400">
                                <span className="text-purple-400">const</span> <span className="text-yellow-300">MeuFrontend</span> = () ={`>`} {"{"}
                            </p>
                            <p className="pl-4 text-gray-300">
                                <span className="text-gray-500">// Foco em performance e SEO</span><br/>
                                framework: <span className="text-green-400">"Next.js 14+"</span>,
                            </p>
                            <p className="pl-4 text-gray-300">
                                <span className="text-gray-500">// Estilização rápida e responsiva</span><br/>
                                style: <span className="text-green-400">"Tailwind CSS"</span>,
                            </p>
                            <p className="pl-4 text-gray-300">
                                <span className="text-gray-500">// Integração com Backend</span><br/>
                                api_consumption: <span className="text-green-400">"REST & GraphQL"</span>
                            </p>
                            <p className="text-gray-400">{"}"}</p>
                        </div>

                         <div className="text-gray-500 mt-4">
                            <span className="text-blue-400">➜  ~</span> <span className="text-gray-300">npm run build</span> <span className="animate-pulse">_</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </section>
  );
}