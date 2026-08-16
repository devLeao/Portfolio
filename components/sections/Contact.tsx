"use client";

import { useState } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { contact, identity } from "@/content/content";
import Magnetic from "@/components/ui/Magnetic";
import BrandIcon from "@/components/ui/BrandIcon";
import { avatarBus } from "@/lib/avatarBus";

type Estado = "parado" | "enviando" | "ok" | "erro";
type Campos = { name: string; email: string; message: string };
type Erros = Partial<Record<keyof Campos, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Formulário de contato com validação real.
 *
 * Se a API responder 501 (sem provedor configurado), o envio cai no cliente
 * de e-mail com tudo preenchido em vez de fingir sucesso. A pessoa que
 * escreveu a mensagem merece saber se ela saiu.
 */
export default function Contact() {
  const { t } = useLocale();
  const [campos, setCampos] = useState<Campos>({ name: "", email: "", message: "" });
  const [erros, setErros] = useState<Erros>({});
  const [estado, setEstado] = useState<Estado>("parado");

  const validar = (valores: Campos): Erros => {
    const saida: Erros = {};
    if (!valores.name.trim()) saida.name = t(contact.form.errors.name);
    if (!EMAIL_RE.test(valores.email.trim())) saida.email = t(contact.form.errors.email);
    if (!valores.message.trim()) saida.message = t(contact.form.errors.message);
    return saida;
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();

    const achados = validar(campos);
    setErros(achados);
    if (Object.keys(achados).length > 0) return;

    setEstado("enviando");

    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campos),
      });

      if (r.ok) {
        setEstado("ok");
        setCampos({ name: "", email: "", message: "" });
        // Recompensa lá no topo: se a pessoa subir depois de enviar, ele
        // está sorrindo.
        avatarBus.emitir({ tipo: "sorrir" });
        return;
      }

      // 501 = nenhum provedor configurado. Em vez de erro seco, abre o
      // cliente de e-mail com a mensagem inteira já montada.
      if (r.status === 501) {
        const assunto = encodeURIComponent(`Portfólio — ${campos.name}`);
        const corpo = encodeURIComponent(`${campos.message}\n\n— ${campos.name} (${campos.email})`);
        window.location.href = `mailto:${identity.email}?subject=${assunto}&body=${corpo}`;
        setEstado("parado");
        return;
      }

      setEstado("erro");
    } catch {
      setEstado("erro");
    }
  };

  const campo = (nome: keyof Campos, tipo: "text" | "email" | "textarea") => {
    const id = `contato-${nome}`;
    const erro = erros[nome];
    const comum = {
      id,
      name: nome,
      value: campos[nome],
      "aria-invalid": Boolean(erro),
      "aria-describedby": erro ? `${id}-erro` : undefined,
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      ) => setCampos((c) => ({ ...c, [nome]: e.target.value })),
      className:
        "w-full rounded-md border border-hairline bg-surface/60 px-4 py-3 text-bone outline-none transition-colors placeholder:text-muted focus:border-iris aria-[invalid=true]:border-bad",
    };

    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={id} className="label">
          {t(contact.form[nome === "name" ? "name" : nome === "email" ? "email" : "message"])}
        </label>
        {tipo === "textarea" ? (
          <textarea {...comum} rows={5} className={`${comum.className} resize-y`} />
        ) : (
          <input {...comum} type={tipo} autoComplete={nome === "email" ? "email" : "name"} />
        )}
        {erro ? (
          <p id={`${id}-erro`} role="alert" className="text-sm text-bad">
            {erro}
          </p>
        ) : null}
      </div>
    );
  };

  return (
    <section id="contato" className="section shell">
      <h2 className="display-xl m-0 max-w-[16ch] text-bone">{t(contact.title)}</h2>
      <p className="body-lg mt-6 max-w-[46ch] text-muted">{t(contact.lede)}</p>

      <div className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:gap-20">
        <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            {campo("name", "text")}
            {campo("email", "email")}
          </div>
          {campo("message", "textarea")}

          <div className="flex flex-wrap items-center gap-5">
            <Magnetic forca={0.3}>
              <button
                type="submit"
                disabled={estado === "enviando"}
                /* Texto escuro sobre o roxo, não bege: bege dava 3,76:1 e o
                   mínimo para texto pequeno é 4,5:1. Com o quase-preto sobe
                   para ~5,9:1 — e a pílula fica mais afirmativa. */
                className="rounded-full bg-iris px-7 py-3 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-void transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {estado === "enviando" ? t(contact.form.sending) : t(contact.form.send)}
              </button>
            </Magnetic>

            {/* `role=status` faz o leitor de tela anunciar o resultado sem
                roubar o foco de quem acabou de apertar enviar. */}
            <p role="status" aria-live="polite" className="text-sm">
              {estado === "ok" ? (
                <span className="text-ok">{t(contact.form.sent)}</span>
              ) : estado === "erro" ? (
                <span className="text-bad">{t(contact.form.failed)}</span>
              ) : null}
            </p>
          </div>
        </form>

        <ul className="m-0 flex list-none flex-col gap-0 p-0">
          {contact.channels.map((canal) => (
            <li key={canal.id} className="border-t border-hairline last:border-b">
              <a
                href={canal.href}
                target={canal.href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-6 py-4 no-underline"
              >
                <span className="label flex items-center gap-2.5">
                  <BrandIcon nome={canal.id} className="size-4 text-muted transition-colors group-hover:text-iris" />
                  {canal.label}
                </span>
                <span className="text-bone transition-colors group-hover:text-iris">
                  {canal.value}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
