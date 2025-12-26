"use client";
import { Mail, Linkedin, MessageSquare, Github, Globe, Youtube } from "lucide-react";

export default function Contact() {
  return (
    <section className="py-24 px-4 relative z-10">
      <div className="max-w-6xl mx-auto text-center space-y-12">
        
        {/* Título */}
        <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
                Vamos construir o <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ff41] to-[#00f3ff]">
                    Futuro Inteligente?
                </span>
            </h2>
            <p className="text-gray-400 font-mono text-sm md:text-base">
                Disponível para projetos freelance e consultoria.
                <br />
                <span className="text-[#00ff41] animate-pulse">_</span> inicializar protocolo de conexão...
            </p>
        </div>

        {/* Container Flex (6 Cards agora) */}
        <div className="flex flex-wrap justify-center gap-6">
            
            {/* 1. GITHUB */}
            <a 
                href="https://github.com/devLeao"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative bg-[#0a0a0a] border border-gray-800 p-8 rounded-xl hover:border-purple-500 transition-all hover:-translate-y-2 w-full md:w-[300px]"
            >
                <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                <div className="flex flex-col items-center gap-4 relative z-10">
                    <div className="p-4 bg-gray-900 rounded-full text-gray-400 group-hover:text-purple-500 group-hover:bg-purple-500/10 transition-colors">
                        <Github size={32} />
                    </div>
                    <h3 className="font-mono text-lg text-white">GitHub</h3>
                    <span className="text-xs text-gray-500 font-mono group-hover:text-purple-500">
                        {`> git_checkout`}
                    </span>
                </div>
            </a>

            {/* 2. LINKEDIN */}
            <a 
                href="https://www.linkedin.com/in/leandro-filipe-silva-le%C3%A3o-514ab1222/"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative bg-[#0a0a0a] border border-gray-800 p-8 rounded-xl hover:border-blue-500 transition-all hover:-translate-y-2 w-full md:w-[300px]"
            >
                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                <div className="flex flex-col items-center gap-4 relative z-10">
                    <div className="p-4 bg-gray-900 rounded-full text-gray-400 group-hover:text-blue-500 group-hover:bg-blue-500/10 transition-colors">
                        <Linkedin size={32} />
                    </div>
                    <h3 className="font-mono text-lg text-white">LinkedIn</h3>
                    <span className="text-xs text-gray-500 font-mono group-hover:text-blue-500">
                        {`> connect_node`}
                    </span>
                </div>
            </a>

            {/* 3. YOUTUBE (NOVO) */}
            <a 
                href="https://www.youtube.com/@devleao"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative bg-[#0a0a0a] border border-gray-800 p-8 rounded-xl hover:border-red-600 transition-all hover:-translate-y-2 w-full md:w-[300px]"
            >
                <div className="absolute inset-0 bg-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                <div className="flex flex-col items-center gap-4 relative z-10">
                    <div className="p-4 bg-gray-900 rounded-full text-gray-400 group-hover:text-red-600 group-hover:bg-red-600/10 transition-colors">
                        <Youtube size={32} />
                    </div>
                    <h3 className="font-mono text-lg text-white">YouTube</h3>
                    <span className="text-xs text-gray-500 font-mono group-hover:text-red-600">
                        {`> watch_content`}
                    </span>
                </div>
            </a>

            {/* 4. EMAIL */}
            <a 
                href="mailto:leandrofls16@gmail.com"
                className="group relative bg-[#0a0a0a] border border-gray-800 p-8 rounded-xl hover:border-[#00ff41] transition-all hover:-translate-y-2 w-full md:w-[300px]"
            >
                <div className="absolute inset-0 bg-[#00ff41]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                <div className="flex flex-col items-center gap-4 relative z-10">
                    <div className="p-4 bg-gray-900 rounded-full text-gray-400 group-hover:text-[#00ff41] group-hover:bg-[#00ff41]/10 transition-colors">
                        <Mail size={32} />
                    </div>
                    <h3 className="font-mono text-lg text-white">Email</h3>
                    <span className="text-xs text-gray-500 font-mono group-hover:text-[#00ff41]">
                        {`> send_packet`}
                    </span>
                </div>
            </a>

            {/* 5. WHATSAPP */}
            <a 
                href="https://wa.me/5531987373781"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative bg-[#0a0a0a] border border-gray-800 p-8 rounded-xl hover:border-green-500 transition-all hover:-translate-y-2 w-full md:w-[300px]"
            >
                <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                <div className="flex flex-col items-center gap-4 relative z-10">
                    <div className="p-4 bg-gray-900 rounded-full text-gray-400 group-hover:text-green-500 group-hover:bg-green-500/10 transition-colors">
                        <MessageSquare size={32} />
                    </div>
                    <h3 className="font-mono text-lg text-white">WhatsApp</h3>
                    <span className="text-xs text-gray-500 font-mono group-hover:text-green-500">
                        {`> start_chat`}
                    </span>
                </div>
            </a>

            {/* 6. MINHA EMPRESA / AGÊNCIA */}
            <a 
                href="https://seusite.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative bg-[#0a0a0a] border border-gray-800 p-8 rounded-xl hover:border-cyan-400 transition-all hover:-translate-y-2 w-full md:w-[300px]"
            >
                <div className="absolute inset-0 bg-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                <div className="flex flex-col items-center gap-4 relative z-10">
                    {/* Container da Logo */}
                    <div className="h-[64px] w-[64px] bg-gray-900 rounded-full flex items-center justify-center overflow-hidden border border-gray-800 group-hover:border-cyan-400 transition-colors">
                        <img 
                            src="/logo.png" 
                            alt="Logo da Agência" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement?.classList.add('fallback-icon');
                            }}
                        />
                         <Globe className="text-cyan-400 hidden group-hover:block absolute" size={32} />
                    </div>
                    
                    <h3 className="font-mono text-lg text-white">Minha Agência</h3>
                    <span className="text-xs text-gray-500 font-mono group-hover:text-cyan-400">
                        {`> access_corp`}
                    </span>
                </div>
            </a>

        </div>

        {/* Footer Final */}
        <div className="pt-20 border-t border-gray-900 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono text-gray-600">
            <p>
                © 2025 DevLeão. Todos os sistemas operacionais.
            </p>
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Servidor: Online (Next.js)
            </div>
        </div>

      </div>
    </section>
  );
}