import MatrixBackground from "@/components/MatrixBackground";
import AIAgent from "@/components/AIAgent";
import AboutMe from "@/components/AboutMe";
import SkillsTerminal from "@/components/SkillsTerminal";
import Projects from "@/components/Projects";
import Certifications from "@/components/Certifications";
import Contact from "@/components/Contact"; // <--- Importando a nova seção de Contato
import { ArrowDown, Cpu, Terminal as TerminalIcon } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-x-hidden font-sans">
      <MatrixBackground />
      
      {/* ================= HERO SECTION ================= */}
      <section className="relative h-screen flex flex-col items-center justify-center px-4 text-center z-10">
        <div className="space-y-4 max-w-4xl animate-fade-in-up">
          
          <div className="font-mono text-lg md:text-xl text-[#00ff41] mb-4 flex items-center justify-center gap-2">
            <TerminalIcon size={20} className="animate-pulse" />
            <p>
              <span className="text-gray-500">{`>`}</span> Olá, eu sou <span className="font-bold text-white bg-black/30 px-2 py-1 rounded">Leandro Filipe</span>_
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00ff41]/30 bg-black/60 text-[#00ff41] text-xs font-mono tracking-wider mb-6 backdrop-blur-sm">
            <span className="w-2 h-2 bg-[#00ff41] rounded-full animate-pulse shadow-[0_0_10px_#00ff41]"></span>
            SYSTEM_READY // AI ENGINEER
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-4 drop-shadow-xl leading-tight">
            Engenharia de <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ff41] via-cyan-300 to-[#00f3ff] font-extrabold text-neon-glow">
              Dados & IA
            </span>
          </h1>
          
          <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-light bg-black/40 p-2 rounded backdrop-blur-sm">
            Transformo terabytes de dados brutos em 
            <span className="text-white font-medium"> sistemas inteligentes </span>
            e decisões automatizadas.
          </p>

          <div className="pt-8 flex flex-wrap justify-center gap-4">
            <a 
              href="#ai-agent"
              className="group px-6 py-3 bg-black text-white border border-[#00ff41] font-bold font-mono rounded transition-all shadow-[0_0_15px_rgba(0,255,65,0.4)] hover:bg-[#00ff41] hover:text-black hover:shadow-[0_0_30px_rgba(0,255,65,0.8)] flex items-center gap-2 cursor-pointer"
            >
              <Cpu size={18} className="text-[#00ff41] group-hover:text-black transition-colors" />
              Iniciar_Agente
            </a>

            <button className="px-6 py-3 border border-gray-700 bg-black/50 text-gray-200 font-mono rounded hover:border-[#00ff41]/50 hover:text-[#00ff41] transition-all backdrop-blur-sm hover:shadow-[0_0_15px_rgba(0,255,65,0.2)]">
              ./ver_projetos
            </button>
          </div>
        </div>

        <div className="absolute bottom-10 animate-bounce text-gray-500">
            <ArrowDown size={24} />
        </div>
      </section>

      {/* ================= AGENTE IA ================= */}
      <div id="ai-agent" className="relative z-10 bg-gradient-to-b from-transparent via-[#050505]/80 to-[#050505]/80 pb-20 pt-10 backdrop-blur-sm">
          <div className="text-center mb-8 px-4">
              <h2 className="text-xl md:text-2xl font-mono text-gray-200 bg-black/60 inline-block px-6 py-3 rounded-md border border-gray-800 backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                  <span className="text-[#00ff41] mr-2">root@portfolio:~$</span>
                  ./fale_com_meu_gemeo_digital.sh
              </h2>
              <p className="text-sm text-gray-400 mt-4 max-w-md mx-auto leading-relaxed">
                Interaja com o modelo treinado nos meus dados profissionais. Pergunte sobre minha stack ou experiência.
              </p>
          </div>
          <AIAgent />
      </div>

      {/* ================= SOBRE MIM ================= */}
      <AboutMe />

      {/* ================= SKILLS (TERMINAL) ================= */}
      <SkillsTerminal />

      {/* ================= PROJETOS (CASE STUDIES) ================= */}
      <Projects />

      {/* ================= DIPLOMAS E CERTIFICAÇÕES ================= */}
      <Certifications />

      {/* ================= CONTATO (FINAL) ================= */}
      <Contact />

    </main>
  );
}