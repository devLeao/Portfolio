import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { SoundProvider } from "@/components/providers/SoundProvider";
import { MotionProvider } from "@/components/providers/MotionProvider";
import SmoothScroll from "@/components/providers/SmoothScroll";
import HtmlLang from "@/components/providers/HtmlLang";
import ScrollNoTopo from "@/components/providers/ScrollNoTopo";
import Header from "@/components/shell/Header";
import Cursor from "@/components/shell/Cursor";
import MotionInvite from "@/components/shell/MotionInvite";
import { LOCALES, meta, nav, t, type Locale } from "@/content/content";

const SITE = "https://devleaoport.vercel.app";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

/**
 * Idioma por rota, não por toggle no cliente.
 *
 * Um toggle deixaria metadata, Open Graph e hreflang num idioma só — o
 * buscador nunca veria o outro. Aqui `/pt` e `/en` são páginas estáticas
 * distintas, cada uma com seus metadados.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!LOCALES.includes(locale as Locale)) return {};
  const l = locale as Locale;

  return {
    metadataBase: new URL(SITE),
    title: t(meta.title, l),
    description: t(meta.description, l),
    alternates: {
      canonical: `/${l}`,
      languages: { "pt-BR": "/pt", en: "/en" },
    },
    openGraph: {
      type: "website",
      locale: l === "pt" ? "pt_BR" : "en_US",
      url: `${SITE}/${l}`,
      title: t(meta.title, l),
      description: t(meta.description, l),
      siteName: "Leandro Leão",
    },
    twitter: {
      card: "summary_large_image",
      title: t(meta.title, l),
      description: t(meta.description, l),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!LOCALES.includes(locale as Locale)) notFound();
  const l = locale as Locale;

  return (
    <LocaleProvider locale={l}>
      {/* MotionProvider por fora do SmoothScroll: é ele que decide se o Lenis
          chega a ser instanciado. */}
      <MotionProvider>
        <SoundProvider>
          <HtmlLang locale={l} />
          <ScrollNoTopo />
          <SmoothScroll>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded focus:bg-surface focus:px-4 focus:py-2 focus:text-bone"
            >
              {t(nav.skipToContent, l)}
            </a>
            <Header />
            <Cursor />
            <MotionInvite />
            {children}
          </SmoothScroll>
        </SoundProvider>
      </MotionProvider>
    </LocaleProvider>
  );
}
