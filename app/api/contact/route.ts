import { NextResponse } from "next/server";

/**
 * Envio da mensagem de contato.
 *
 * O provedor fica atrás de variável de ambiente. SEM `RESEND_API_KEY`
 * configurada, a rota responde 501 e o formulário cai no `mailto:` — em vez
 * de mostrar "enviado" para uma mensagem que não saiu de lugar nenhum.
 * Formulário que mente é pior que formulário que não existe.
 *
 * Para ativar de verdade, no ambiente da Vercel:
 *   RESEND_API_KEY=re_...
 *   CONTACT_TO=leandrofls16@gmail.com
 *   CONTACT_FROM=contato@seudominio.com   (domínio verificado na Resend)
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Corpo = { name?: unknown; email?: unknown; message?: unknown };

export async function POST(req: Request) {
  let corpo: Corpo;
  try {
    corpo = (await req.json()) as Corpo;
  } catch {
    return NextResponse.json({ erro: "json_invalido" }, { status: 400 });
  }

  const nome = typeof corpo.name === "string" ? corpo.name.trim() : "";
  const email = typeof corpo.email === "string" ? corpo.email.trim() : "";
  const mensagem = typeof corpo.message === "string" ? corpo.message.trim() : "";

  // A validação do cliente é conveniência; esta aqui é a que vale.
  if (!nome || nome.length > 120) {
    return NextResponse.json({ erro: "nome" }, { status: 400 });
  }
  if (!EMAIL_RE.test(email) || email.length > 200) {
    return NextResponse.json({ erro: "email" }, { status: 400 });
  }
  if (!mensagem || mensagem.length > 5000) {
    return NextResponse.json({ erro: "mensagem" }, { status: 400 });
  }

  const chave = process.env.RESEND_API_KEY;
  const para = process.env.CONTACT_TO;
  const de = process.env.CONTACT_FROM;

  if (!chave || !para || !de) {
    return NextResponse.json({ erro: "sem_provedor" }, { status: 501 });
  }

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${chave}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: de,
        to: [para],
        reply_to: email,
        subject: `Portfólio — ${nome}`,
        text: `De: ${nome} <${email}>\n\n${mensagem}`,
      }),
    });

    if (!r.ok) {
      return NextResponse.json({ erro: "provedor" }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ erro: "rede" }, { status: 502 });
  }
}
