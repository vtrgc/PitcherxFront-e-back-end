"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { contarNotificacoesNaoLidas } from "../services/conexao.service";

interface NotificacoesContextValue {
  /** Quantidade de notificações não lidas (GET /conexao/notificacoes/nao-lidas); null = ainda não carregou/indisponível. */
  naoLidas: number | null;
  /** Busca o contador novamente no servidor. */
  atualizarNaoLidas: () => Promise<void>;
  /** Ajuste imediato após uma ação local já confirmada pela API (ex.: marcar como lida). */
  definirNaoLidas: (valor: number | ((atual: number) => number)) => void;
}

const NotificacoesContext = createContext<NotificacoesContextValue | undefined>(undefined);

/** Intervalo de atualização do contador enquanto a aba está visível. */
const INTERVALO_MS = 60_000;

export function NotificacoesProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const idUsuario = usuario?.idUsuario ?? null;
  const [naoLidas, setNaoLidas] = useState<number | null>(null);
  const idRef = useRef(idUsuario);

  useEffect(() => {
    idRef.current = idUsuario;
  }, [idUsuario]);

  const atualizarNaoLidas = useCallback(async () => {
    const id = idRef.current;
    if (!id) return;
    try {
      const total = await contarNotificacoesNaoLidas();
      if (idRef.current === id) setNaoLidas(total);
    } catch {
      /* contador indisponível: o ícone simplesmente não mostra número */
    }
  }, []);

  useEffect(() => {
    if (!idUsuario) return;
    let cancelado = false;
    const tick = () => {
      if (!cancelado && document.visibilityState === "visible") atualizarNaoLidas();
    };
    tick();
    const intervalo = window.setInterval(tick, INTERVALO_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      cancelado = true;
      window.clearInterval(intervalo);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [idUsuario, atualizarNaoLidas]);

  const definirNaoLidas = useCallback((valor: number | ((atual: number) => number)) => {
    setNaoLidas((atual) => Math.max(0, typeof valor === "function" ? valor(atual ?? 0) : valor));
  }, []);

  const value = useMemo(
    () => ({ naoLidas: idUsuario ? naoLidas : null, atualizarNaoLidas, definirNaoLidas }),
    [idUsuario, naoLidas, atualizarNaoLidas, definirNaoLidas]
  );

  return <NotificacoesContext.Provider value={value}>{children}</NotificacoesContext.Provider>;
}

export function useNotificacoes() {
  const ctx = useContext(NotificacoesContext);
  if (!ctx) throw new Error("useNotificacoes precisa ser usado dentro de um NotificacoesProvider");
  return ctx;
}
