"use client";

import { useEffect, useRef } from "react";

/**
 * Executa `tarefa` a cada `intervaloMs` enquanto a aba estiver visível, e logo que ela volta
 * a ficar visível. Uma execução só começa quando a anterior termina (sem consultas empilhadas
 * em rede lenta). `ativo = false` pausa tudo; `executarAoIniciar` roda uma vez já no início.
 */
export function useAtualizacaoPeriodica(
  tarefa: () => Promise<void> | void,
  intervaloMs: number,
  ativo = true,
  executarAoIniciar = false
) {
  const tarefaRef = useRef(tarefa);
  useEffect(() => {
    tarefaRef.current = tarefa;
  }, [tarefa]);

  useEffect(() => {
    if (!ativo) return;
    let cancelado = false;
    let rodando = false;
    const tick = async () => {
      if (cancelado || rodando || document.visibilityState !== "visible") return;
      rodando = true;
      try {
        await tarefaRef.current();
      } catch {
        /* quem chama trata os erros; aqui só evita interromper o ciclo */
      } finally {
        rodando = false;
      }
    };
    if (executarAoIniciar) {
      rodando = true;
      Promise.resolve()
        .then(() => tarefaRef.current())
        .catch(() => undefined)
        .finally(() => {
          rodando = false;
        });
    }
    const intervalo = window.setInterval(tick, intervaloMs);
    const aoMudarVisibilidade = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", aoMudarVisibilidade);
    window.addEventListener("focus", aoMudarVisibilidade);
    return () => {
      cancelado = true;
      window.clearInterval(intervalo);
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
      window.removeEventListener("focus", aoMudarVisibilidade);
    };
  }, [intervaloMs, ativo, executarAoIniciar]);
}
