"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CHAVE_ANIMAR, ID_ESPERA, ROTA_SEM_ANIMACAO } from "./constantes";

function removerEspera() {
  document.getElementById(ID_ESPERA)?.remove();
}

/**
 * Em recarga/volta, o navegador só termina de restaurar a rolagem por volta do `load`. O palco
 * continua escondido até lá (e mais dois quadros, para a timeline já estar na cena certa).
 */
function liberarPalco() {
  if (!document.getElementById(ID_ESPERA)) return;
  const soltar = () => requestAnimationFrame(() => requestAnimationFrame(removerEspera));
  if (document.readyState === "complete") soltar();
  else window.addEventListener("load", soltar, { once: true });
}

/** A pessoa tem "movimento reduzido" no sistema e não escolheu a versão animada? */
function prefereSemAnimacao() {
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    return window.localStorage.getItem(CHAVE_ANIMAR) !== "1";
  } catch {
    return true;
  }
}

/**
 * Raiz da página inicial — só existe a experiência animada. Quem prefere ler (link "Sem animação"),
 * tem "movimento reduzido" no sistema ou está sem JavaScript vai para /como-funciona.
 *
 * O motor (GSAP + ScrollTrigger + Lenis) é baixado logo após a primeira pintura (ou no primeiro
 * gesto de rolagem) e montado em etapas curtas; até ficar pronto, a primeira cena já está na
 * tela — ela é o quadro inicial exato da timeline.
 *
 * Nenhum estado React muda durante o scroll: o GSAP escreve direto nos estilos.
 */
export default function HomeExperience({ children }: { children: ReactNode }) {
  const raizRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const raiz = raizRef.current;
    if (!raiz) return;

    // Navegação dentro do app (o script inicial só roda na carga do documento).
    if (prefereSemAnimacao()) {
      router.replace(ROTA_SEM_ANIMACAO);
      return;
    }

    let desmontar: (() => void) | null = null;
    let vivo = true;

    async function iniciar() {
      try {
        const { montarMotor } = await import("./motion/mestra");
        if (!vivo) return;
        desmontar = montarMotor(raiz!, { aoPronto: liberarPalco });
      } catch (erro) {
        // Sem o motor não há experiência: a mesma história, sem animação.
        console.warn("[home] animação indisponível; abrindo a versão sem animação.", erro);
        if (vivo) window.location.replace(ROTA_SEM_ANIMACAO);
      }
    }

    // O motor sobe logo DEPOIS da primeira pintura (a cena 01 já está no HTML), ou antes disso
    // se a pessoa já começar a rolar/tocar/teclar.
    const GATILHOS = ["wheel", "touchstart", "keydown", "pointerdown", "scroll"] as const;
    let agendado = false;
    let quadro = 0;
    let tempo: ReturnType<typeof setTimeout> | undefined;
    let ocioso = 0;
    const tirarGatilhos = () => GATILHOS.forEach((e) => window.removeEventListener(e, primeiraVez));
    function primeiraVez() {
      if (agendado) return;
      agendado = true;
      tirarGatilhos();
      cancelAnimationFrame(quadro);
      clearTimeout(tempo);
      if (ocioso) window.cancelIdleCallback?.(ocioso);
      iniciar();
    }
    GATILHOS.forEach((e) => window.addEventListener(e, primeiraVez, { passive: true }));
    quadro = requestAnimationFrame(() => {
      tempo = globalThis.setTimeout(() => {
        if (window.requestIdleCallback) ocioso = window.requestIdleCallback(primeiraVez, { timeout: 700 });
        else primeiraVez();
      }, 0);
    });

    return () => {
      vivo = false;
      agendado = true;
      tirarGatilhos();
      cancelAnimationFrame(quadro);
      clearTimeout(tempo);
      if (ocioso) window.cancelIdleCallback?.(ocioso);
      desmontar?.();
      desmontar = null;
      removerEspera();
    };
  }, [router]);

  return (
    <div ref={raizRef} className="hx-home">
      {children}
    </div>
  );
}
