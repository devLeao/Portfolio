"use client";
import { motion } from "framer-motion";
import { User, Code2 } from "lucide-react";

export default function AboutMe() {
  return (
    <section className="py-20 px-4 bg-black/60 backdrop-blur-md relative border-b border-gray-900/50">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        
        {/* Lado Esquerdo: O Humano */}
        <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
          <div className="flex items-center gap-2 text-neon-green mb-4">
            <User size={24} />
            <h2 className="text-2xl font-mono font-bold">Quem sou eu_</h2>
          </div>
          
          <div className="prose prose-invert max-w-none text-gray-400 leading-relaxed text-lg">
            <p>
              Muitos escrevem código, mas poucos entendem o <span className="text-gray-200 font-bold">poder dos dados</span> por trás dele.
            </p>
            <p>
              Comecei minha jornada desenvolvendo para a web, mas logo percebi que a verdadeira revolução não está apenas nas telas, mas na inteligência que as alimenta. 
            </p>
            <p>
              Hoje, atuo na interseção entre <span className="text-neon-cyan">Engenharia de Software</span> e <span className="text-neon-green">Inteligência Artificial</span>. Meu foco não é apenas entregar um sistema, mas criar agentes autônomos e pipelines de dados que economizam tempo e geram valor real.
            </p>
          </div>
        </motion.div>

        {/* Lado Direito: A Máquina (JSON) */}
        <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
        >
            {/* Barra de Título do "Arquivo" */}
            <div className="bg-[#1e1e1e] rounded-t-lg p-3 flex items-center gap-2 border-b border-gray-700">
                <Code2 size={16} className="text-yellow-400" />
                <span className="text-xs text-gray-400 font-mono">perfil_dev.json</span>
            </div>
            
            {/* Conteúdo JSON */}
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-b-lg p-6 font-mono text-sm md:text-base overflow-x-auto shadow-2xl shadow-neon-green/5">
                <pre>
<span className="text-purple-400">{"{"}</span>
  <span className="text-blue-400">"nome"</span>: <span className="text-green-400">"Leandro Filipe"</span>,
  <span className="text-blue-400">"alias"</span>: <span className="text-green-400">"DevLeão"</span>,
  <span className="text-blue-400">"localizacao"</span>: <span className="text-green-400">"MG, Brasil"</span>,
  <span className="text-blue-400">"foco_atual"</span>: <span className="text-yellow-300">"Agentes de IA & Automação"</span>,
  <span className="text-blue-400">"hard_skills"</span>: <span className="text-purple-400">{"["}</span>
    <span className="text-green-400">"Python"</span>, 
    <span className="text-green-400">"LLMs"</span>, 
    <span className="text-green-400">"SQL"</span>,
    <span className="text-green-400">"n8n"</span>
  <span className="text-purple-400">{"]"}</span>,
  {/*<span className="text-blue-400">"status"</span>: <span className="text-neon-cyan">"Open to Work"</span>*/}
<span className="text-purple-400">{"}"}</span>
                </pre>
            </div>
            
            {/* Efeito decorativo atrás */}
            <div className="absolute -z-10 top-10 -right-10 w-full h-full border border-gray-800 rounded-lg opacity-30"></div>
        </motion.div>

      </div>
    </section>
  );
}