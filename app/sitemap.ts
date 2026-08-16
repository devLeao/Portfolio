import type { MetadataRoute } from "next";
import { LOCALES } from "@/content/content";

const SITE = "https://leandroleao.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  return LOCALES.map((locale) => ({
    url: `${SITE}/${locale}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: locale === "pt" ? 1 : 0.8,
    alternates: {
      languages: { "pt-BR": `${SITE}/pt`, en: `${SITE}/en` },
    },
  }));
}
