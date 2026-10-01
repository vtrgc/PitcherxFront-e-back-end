import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

const EVENTOS_PADRAO = "visibilitychange,DOMContentLoaded,load,resize";

/** Registra o ScrollTrigger. O resize é tratado pelo próprio motor (reconstrói preservando o progresso). */
export function registrar() {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true, autoRefreshEvents: "visibilitychange,DOMContentLoaded,load" });
}

export function restaurarConfig() {
  ScrollTrigger.config({ autoRefreshEvents: EVENTOS_PADRAO });
}

/**
 * Lenis suaviza só roda do mouse/trackpad (no toque a rolagem continua nativa) e é
 * sincronizado ao ticker do GSAP — um único loop de animação para tudo.
 */
let instanciasAtivas = 0;

/** Remove as classes "lenis*" do <html> (só quando não há outra instância da Home ativa). */
function limparClassesLenis() {
  if (instanciasAtivas > 0) return;
  const raiz = document.documentElement;
  Array.from(raiz.classList).forEach((c) => {
    if (c === "lenis" || c.startsWith("lenis-")) raiz.classList.remove(c);
  });
}

export function criarLenis() {
  instanciasAtivas++;
  const lenis = new Lenis({ autoRaf: false, lerp: 0.085, wheelMultiplier: 0.85, touchMultiplier: 1, syncTouch: false });
  const aoRolar = () => ScrollTrigger.update();
  lenis.on("scroll", aoRolar);
  const tick = (tempo: number) => lenis.raf(tempo * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  return {
    lenis,
    destruir() {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.off("scroll", aoRolar);
      // O Lenis agenda um timeout (~400 ms) que recoloca a classe "lenis" no <html> depois de uma
      // rolagem nativa; ele não é cancelado pelo destroy(). Cancelamos aqui e limpamos de novo depois.
      window.clearTimeout((lenis as unknown as { _resetVelocityTimeout?: number })._resetVelocityTimeout);
      lenis.stop();
      lenis.destroy();
      instanciasAtivas = Math.max(0, instanciasAtivas - 1);
      limparClassesLenis();
      window.setTimeout(limparClassesLenis, 600);
    },
  };
}

export { gsap, ScrollTrigger };
