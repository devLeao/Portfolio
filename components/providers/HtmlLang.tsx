"use client";

import { useEffect } from "react";
import type { Locale } from "@/content/content";

/**
 * O `<html lang>` vive no layout raiz, que não conhece a rota. Este
 * componente corrige o atributo no cliente para o idioma da página — leitor
 * de tela lendo português com pronúncia inglesa é falha de acessibilidade,
 * não detalhe.
 */
export default function HtmlLang({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale === "pt" ? "pt-BR" : "en";
  }, [locale]);

  return null;
}
