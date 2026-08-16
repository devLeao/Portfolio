import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Demos from "@/components/sections/Demos";
import Skills from "@/components/sections/Skills";
import Experience from "@/components/sections/Experience";
import Work from "@/components/sections/Work";
import PixelWorld from "@/components/sections/PixelWorld";
import Formacao from "@/components/sections/Formacao";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/shell/Footer";

/**
 * A ordem conta uma história: eu trabalho (dark), atravesso (portal), eu me
 * divirto (pixel), volto (portal) e fecho pedindo trabalho.
 */
export default function Page() {
  return (
    <>
      <main id="main">
        <Hero />
        <About />
        <Demos />
        <Skills />
        <Experience />
        <Work />

        <PixelWorld />

        <Formacao />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
