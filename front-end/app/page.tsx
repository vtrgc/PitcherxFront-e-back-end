import type { Viewport } from "next";
import "./components/home/home.css";

import HomeExperience from "./components/home/HomeExperience";
import ScriptInicial from "./components/home/ScriptInicial";
import HomeHeader from "./components/home/HomeHeader";
import Palco from "./components/home/palco/Palco";
import CenaFinal from "./components/home/CenaFinal";
import { ROTA_SEM_ANIMACAO } from "./components/home/constantes";

/** Só a Home: cobre a área do notch (safe areas no CSS) e pinta a barra do navegador. */
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#0E0C12",
};

/** Sem JavaScript não há animação: a página leva para a versão sem animação (e mostra o link). */
const SEM_JS = `.hx-home .hx-trilha{display:none!important}.hx-home .hx-sem-js{display:flex!important}.hx-home .hx-carregando{visibility:visible!important}`;

export default function Home() {
  return (
    <HomeExperience>
      {/* A fonte do título da cena 01 (LCP) chega junto com o CSS (o React leva o <link> para o <head>). */}
      <link rel="preload" href="/home/v2/fonte/archivo-home.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      <ScriptInicial />
      <noscript>
        <style>{SEM_JS}</style>
        <meta httpEquiv="refresh" content={`0; url=${ROTA_SEM_ANIMACAO}`} />
      </noscript>
      <HomeHeader />
      <main>
        <Palco />
        <div className="hx-sem-js">
          <p>Esta página é uma experiência animada e precisa de JavaScript.</p>
          <a href={ROTA_SEM_ANIMACAO} className="hx-cta hx-cta--cheio">
            Ver como o PitcherX funciona
          </a>
        </div>
        <CenaFinal />
      </main>
    </HomeExperience>
  );
}
