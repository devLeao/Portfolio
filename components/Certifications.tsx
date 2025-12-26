"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, GraduationCap, CheckCircle, ShieldCheck, Eye, X } from "lucide-react";

// Lista de Certificações
const certifications = [
  {
    title: "Análise e Desenvolvimento de Sistemas",
    issuer: "Faculdade Anhanguera",
    date: "Em andamento (5º Período)",
    type: "academic",
    id: "ACAD-2025-DEV",
    description: "Foco em Engenharia de Software, Algoritmos e Banco de Dados Relacional.",
    // Agora usamos uma LISTA (array) de imagens. Se não tiver, deixe vazio [].
    images: [] 
  },
  {
    title: "Especialista em Automação & IA",
    issuer: "Certificação Técnica",
    date: "2024",
    type: "pro",
    id: "PRO-8821-AI",
    description: "Desenvolvimento de agentes autônomos, fine-tuning de LLMs e orquestração com n8n.",
    images: ["/agenteIA.png"]
  },
  {
    // --- AQUI ESTÁ O CARD DUPLO QUE VOCÊ QUERIA ---
    title: "Data Analytics & BI (Formação Completa)",
    issuer: "Formação Complementar",
    date: "2023",
    type: "pro",
    id: "DATA-9912-BI",
    description: "Modelagem de dados, ETL avançado e criação de Dashboards para tomada de decisão.",
    // Coloque os nomes exatos das suas imagens aqui dentro dos colchetes
    images: ["/cert-web1.png", "/cert-web2.png", "/cert-web3.png"]
  },
  {
    title: "Desenvolvimento Web Completo", 
    issuer: "Certificação Técnica",
    date: "Dez 2025",
    type: "pro",
    id: "UC-68a23520", 
    description: "Domínio Fullstack: HTML5, CSS3, JS, PHP 7, MySQL e construção de 20 projetos práticos.",
    images: ["/cert-web.png"] // Mesmo se for só uma, tem que estar entre colchetes []
  }
];

export default function Certifications() {
  // O estado agora guarda uma lista de strings ou null
  const [selectedCerts, setSelectedCerts] = useState<string[] | null>(null);

  return (
    <section className="py-24 px-4 bg-transparent relative">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Cabeçalho */}
        <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-white flex items-center justify-center gap-3">
                <ShieldCheck className="text-[#00ff41]" size={32} />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                    Credenciais & Diplomas
                </span>
            </h2>
            <p className="text-gray-400 font-mono text-sm">
                Protocolos de conhecimento validados no sistema.
            </p>
        </div>

        {/* Grid de Certificados */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certifications.map((cert, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative group bg-[#0a0a0a]/80 backdrop-blur-md border border-gray-800 rounded-lg p-6 hover:border-[#00ff41]/50 transition-all overflow-hidden flex flex-col"
                >
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#00ff41] opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_15px_#00ff41]" />
                    
                    <div className="flex items-start gap-4 flex-1">
                        <div className="p-3 bg-gray-900 rounded-lg border border-gray-700 group-hover:border-[#00ff41] transition-colors h-fit">
                            {cert.type === 'academic' ? (
                                <GraduationCap className="text-white group-hover:text-[#00ff41]" size={24} />
                            ) : (
                                <Award className="text-white group-hover:text-[#00f3ff]" size={24} />
                            )}
                        </div>

                        <div className="space-y-1 flex-1">
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-bold text-gray-100 group-hover:text-white">
                                    {cert.title}
                                </h3>
                                <CheckCircle size={16} className="text-gray-600 group-hover:text-[#00ff41] transition-colors" />
                            </div>
                            
                            <p className="text-[#00ff41] text-xs font-mono uppercase tracking-wider">
                                {cert.issuer}
                            </p>
                            
                            <p className="text-gray-400 text-sm leading-relaxed pt-2 border-t border-gray-800 mt-2">
                                {cert.description}
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-800/50">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-gray-600 font-mono">ID: {cert.id}</span>
                            <span className="text-[10px] text-gray-500 font-mono">{cert.date}</span>
                        </div>

                        {/* Botão Ver Credencial (só aparece se a lista de imagens não estiver vazia) */}
                        {cert.images && cert.images.length > 0 && (
                            <button 
                                onClick={() => setSelectedCerts(cert.images)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-[#00ff41]/10 text-[#00ff41] text-xs font-mono rounded hover:bg-[#00ff41] hover:text-black transition-all border border-[#00ff41]/20"
                            >
                                <Eye size={12} />
                                Ver Credencial ({cert.images.length})
                            </button>
                        )}
                    </div>
                </motion.div>
            ))}
        </div>
      </div>

      {/* --- MODAL (AGORA SUPORTA MÚLTIPLAS IMAGENS) --- */}
      <AnimatePresence>
        {selectedCerts && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedCerts(null)}
                className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer overflow-y-auto"
            >
                <button className="fixed top-5 right-5 text-gray-400 hover:text-white p-2 bg-black/50 rounded-full z-50">
                    <X size={32} />
                </button>

                {/* Container das Imagens */}
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="max-w-4xl w-full flex flex-col gap-6 py-10"
                    onClick={(e) => e.stopPropagation()} 
                >
                    {selectedCerts.map((imgSrc, idx) => (
                        <div key={idx} className="relative rounded-lg overflow-hidden border border-[#00ff41]/30 shadow-[0_0_30px_rgba(0,255,65,0.1)]">
                             <img 
                                src={imgSrc} 
                                alt={`Certificado ${idx + 1}`} 
                                className="w-full h-auto object-contain"
                            />
                        </div>
                    ))}
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}