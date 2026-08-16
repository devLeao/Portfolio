"use client";

import { createContext, useContext, useMemo } from "react";
import { DEFAULT_LOCALE, t as traduzir, type I18n, type Locale } from "@/content/content";

type Ctx = {
  locale: Locale;
  /** Atalho: `t(algumTextoI18n)` já no idioma da rota. */
  t: (valor: I18n) => string;
};

const LocaleCtx = createContext<Ctx>({
  locale: DEFAULT_LOCALE,
  t: (valor) => valor[DEFAULT_LOCALE],
});

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const valor = useMemo<Ctx>(
    () => ({ locale, t: (v: I18n) => traduzir(v, locale) }),
    [locale]
  );

  return <LocaleCtx.Provider value={valor}>{children}</LocaleCtx.Provider>;
}

export function useLocale(): Ctx {
  return useContext(LocaleCtx);
}
