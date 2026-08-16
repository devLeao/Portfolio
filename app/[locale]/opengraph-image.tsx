import { ImageResponse } from "next/og";
import { identity, meta, LOCALES, t, type Locale } from "@/content/content";

export const alt = "Leandro Leão";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

/**
 * Cartão social gerado no build, um por idioma.
 *
 * Sem fonte customizada de propósito: embarcar a Fraunces aqui custaria um
 * fetch de ~100KB por rota no build, e a sans do sistema no tamanho gigante
 * do card resolve. Os tokens são repetidos em literal porque o `ImageResponse`
 * roda fora do documento — não existe `:root` para ler.
 */
export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const l = (LOCALES.includes(locale as Locale) ? locale : "pt") as Locale;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0A0808 0%, #191227 60%, #2A1A45 100%)",
          padding: "72px",
          color: "#F5F1EA",
        }}
      >
        <div style={{ display: "flex", fontSize: 26, color: "#8B8489", letterSpacing: 4 }}>
          {t(identity.role, l).toUpperCase()}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 132, fontWeight: 700, lineHeight: 1, letterSpacing: -4 }}>
            {identity.firstName.toUpperCase()}
          </div>
          <div style={{ fontSize: 132, fontWeight: 700, lineHeight: 1, letterSpacing: -4 }}>
            {identity.lastName.toUpperCase()}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 56, height: 6, background: "#8B5CF6" }} />
          {/* Uma string só: o Satori conta `{expressão}` e o "." literal como
              dois filhos e exige display:flex no pai. */}
          <div style={{ fontSize: 30, color: "#F5F1EA", maxWidth: 900 }}>
            {`${t(meta.description, l).split(".")[0]}.`}
          </div>
        </div>
      </div>
    ),
    size
  );
}
