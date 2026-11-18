"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { contarMensagensNaoLidas } from "../services/mensagem.service";

interface MensagensContextValue {
  /** Mensagens recebidas e não lidas (GET /mensagem/nao-lidas); null = ainda não carregou. */
  naoLidas: number | null;
  /** Busca o contador de novo (ex.: depois de abrir uma conversa). */
  atualizarNaoLidas: () => Promise<void>;
}

const MensagensContext = createContext<MensagensContextValue | undefined>(undefined);

/** Intervalo do contador da navegação enquanto a aba está visível. */
const INTERVALO_MS = 30_000;

/**
 * Contador de mensagens não lidas exibido na navegação. Atualiza sozinho (consulta periódica
 * só com a aba visível, como o contador de notificações). Administradores não usam mensagens.
 */
export function MensagensProvider({ children }: { children: ReactNode }) {
  const { usuario, isAdmin } = useAuth();
  const idUsuario = usuario && !isAdmin && usuario.verificado !== false ? usuario.idUsuario : null;
  const [naoLidas, setNaoLidas] = useState<number | null>(null);
  const idRef = useRef(idUsuario);

  useEffect(() => {
    idRef.current = idUsuario;
  }, [idUsuario]);

  const atualizarNaoLidas = useCallback(async () => {
    const id = idRef.current;
    if (!id) return;
    try {
      const total = await contarMensagensNaoLidas();
      if (idRef.current === id) setNaoLidas(total);
    } catch {
      /* contador indisponível: o ícone fica sem número */
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

  const value = useMemo(
    () => ({ naoLidas: idUsuario ? naoLidas : null, atualizarNaoLidas }),
    [idUsuario, naoLidas, atualizarNaoLidas]
  );

  return <MensagensContext.Provider value={value}>{children}</MensagensContext.Provider>;
}

export function useMensagensNaoLidas() {
  const ctx = useContext(MensagensContext);
  if (!ctx) throw new Error("useMensagensNaoLidas precisa ser usado dentro de um MensagensProvider");
  return ctx;
}
