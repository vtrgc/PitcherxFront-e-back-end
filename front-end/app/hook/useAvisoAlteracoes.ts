"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Protege alterações não salvas:
 *  - fechar/recarregar a aba → aviso nativo do navegador (`beforeunload`);
 *  - clicar em um link interno (sidebar, menu etc.) → diálogo de confirmação do PitcherX.
 *
 * O App Router não expõe eventos de navegação, por isso os cliques em <a> são
 * interceptados na fase de captura, antes do <Link> do Next tratá-los.
 */
export function useAvisoAlteracoes(ativo: boolean, confirmarSaida: () => Promise<boolean>) {
  const router = useRouter();
  const ativoRef = useRef(ativo);
  const confirmarRef = useRef(confirmarSaida);

  useEffect(() => {
    ativoRef.current = ativo;
    confirmarRef.current = confirmarSaida;
  }, [ativo, confirmarSaida]);

  useEffect(() => {
    function antesDeSair(e: BeforeUnloadEvent) {
      if (!ativoRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    }

    function aoClicar(e: MouseEvent) {
      if (!ativoRef.current || e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const alvo = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!alvo || alvo.target === "_blank" || alvo.hasAttribute("download")) return;
      const url = new URL(alvo.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      e.preventDefault();
      e.stopPropagation();
      confirmarRef.current().then((sair) => {
        if (sair) {
          ativoRef.current = false;
          router.push(`${url.pathname}${url.search}${url.hash}`);
        }
      });
    }

    window.addEventListener("beforeunload", antesDeSair);
    document.addEventListener("click", aoClicar, true);
    return () => {
      window.removeEventListener("beforeunload", antesDeSair);
      document.removeEventListener("click", aoClicar, true);
    };
  }, [router]);

  /** Desliga o aviso (ex.: logo após salvar, antes de redirecionar). */
  return {
    liberar() {
      ativoRef.current = false;
    },
  };
}
