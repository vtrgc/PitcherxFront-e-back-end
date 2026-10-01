import type { Metadata, Viewport } from "next";
import "../components/como-funciona/como-funciona.css";
import { Chamado, Faixa, Ferramentas, Hero, Papeis, Perguntas, Rodape, Passos } from "../components/como-funciona/Secoes";

export const metadata: Metadata = {
  title: "Como funciona — PitcherX",
  description:
    "Transforme uma ideia em projeto, publique para a comunidade e monte a equipe que vai construí-la com você. Veja como o PitcherX funciona.",
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#FFFFFF",
};

/** Sem JavaScript: os botões de visitante (reservados enquanto a sessão carrega) aparecem. */
const SEM_JS = `.cf .cf-carregando{visibility:visible!important}`;

/**
 * Página inicial SEM animação: para quem prefere ler, tem "movimento reduzido" no sistema
 * ou está sem JavaScript. Conta a mesma história da experiência animada (/), em seções.
 */
export default function ComoFunciona() {
  return (
    <div className="cf">
      <link rel="preload" href="/home/v2/fonte/archivo-home.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      <noscript>
        <style>{SEM_JS}</style>
      </noscript>
      <main>
        <Hero />
        <Faixa />
        <Passos />
        <Ferramentas />
        <Papeis />
        <Perguntas />
        <Chamado />
      </main>
      <Rodape />
    </div>
  );
}
