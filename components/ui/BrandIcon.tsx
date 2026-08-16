"use client";

import { siGithub, siWhatsapp } from "simple-icons";

/**
 * Ícones dos canais de contato.
 *
 * GitHub e WhatsApp vêm do Simple Icons — mesma fonte dos logos dos keycaps.
 *
 * Dois são desenhados aqui:
 *
 * - LinkedIn saiu do Simple Icons, como as marcas da Microsoft. O mark é um
 *   quadrado arredondado com "in" dentro, então está reconstruído fiel.
 * - E-mail não é marca de ninguém. Um envelope é o certo: pôr o logo do
 *   Gmail seria afirmar que o endereço é do Gmail, informação que deixa de
 *   valer no dia em que o provedor mudar.
 */

const LINKEDIN =
  "M22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0ZM7.12 20.45H3.56V9h3.56v11.45ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13Zm15.11 13.02h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29Z";

const ENVELOPE =
  "M1.5 4.5h21a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5h-21A1.5 1.5 0 0 1 0 18V6a1.5 1.5 0 0 1 1.5-1.5Zm.6 2.4v.9l9.9 6.3 9.9-6.3v-.9H2.1Zm19.8 3.5-8.9 5.6a2 2 0 0 1-2 0L2.1 10.4V17.1h19.8v-6.7Z";

export const CAMINHOS: Record<string, string> = {
  github: siGithub.path,
  linkedin: LINKEDIN,
  whatsapp: siWhatsapp.path,
  email: ENVELOPE,
};

export default function BrandIcon({
  nome,
  className = "size-4",
}: {
  nome: string;
  className?: string;
}) {
  const d = CAMINHOS[nome];
  if (!d) return null;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      <path d={d} />
    </svg>
  );
}
