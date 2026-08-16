import { redirect } from "next/navigation";
import { DEFAULT_LOCALE } from "@/content/content";

/** A raiz não renderiza nada: pt é o padrão, e o idioma mora na rota. */
export default function Root() {
  redirect(`/${DEFAULT_LOCALE}`);
}
