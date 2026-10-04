"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { useFeedback } from "../components/ui/FeedbackProvider";
import { contarNotificacoesNaoLidas } from "../services/conexao.service";
import { EVENTO_ATIVIDADE, listarAtividade, marcarAtividadeComoLida, verificarAtividade } from "../services/atividade.service";
import { NotificacaoAtividade } from "../lib/atividade";

interface NotificacoesContextValue {
  /**
   * Não lidas no total: notificações do servidor (GET /conexao/notificacoes/nao-lidas) +
   * notificações de atividade (curtidas, comentários, respostas, votos — ver lib/atividade).
   * null = ainda não carregou/indisponível.
   */
  naoLidas: number | null;
  /** Busca o contador do servidor novamente. */
  atualizarNaoLidas: () => Promise<void>;
  /** Ajuste imediato do contador do SERVIDOR após uma ação já confirmada pela API. */
  definirNaoLidas: (valor: number | ((atual: number) => number)) => void;
  /** Notificações de atividade (mais recentes primeiro). */
  atividade: NotificacaoAtividade[];
  /** Verifica agora se houve novas curtidas/comentários. */
  verificarAgora: () => Promise<void>;
  /** Marca notificações de atividade como lidas (sem ids: todas). */
  marcarAtividadeLida: (ids?: string[]) => void;
}

const NotificacoesContext = createContext<NotificacoesContextValue | undefined>(undefined);

/** Intervalo de atualização enquanto a aba está visível. */
const INTERVALO_MS = 60_000;

export function NotificacoesProvider({ children }: { children: ReactNode }) {
  const { usuario, isAdmin } = useAuth();
  const { notificar } = useFeedback();
  const idUsuario = usuario?.idUsuario ?? null;
  // Administradores não publicam nem comentam: só recebem as notificações do servidor.
  const comAtividade = !!idUsuario && !isAdmin;
  const [naoLidasServidor, setNaoLidas] = useState<number | null>(null);
  const [atividade, setAtividade] = useState<NotificacaoAtividade[]>([]);
  const idRef = useRef(idUsuario);
  const notificarRef = useRef(notificar);

  useEffect(() => {
    idRef.current = idUsuario;
    notificarRef.current = notificar;
  }, [idUsuario, notificar]);

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

  const verificarAgora = useCallback(async () => {
    const id = idRef.current;
    if (!id) return;
    try {
      const novos = await verificarAtividade(id);
      if (idRef.current !== id || novos.length === 0) return;
      // Aviso na tela para o que acabou de chegar.
      notificarRef.current(novos.length === 1 ? `${novos[0].titulo}: ${novos[0].mensagem}` : `Você tem ${novos.length} novas notificações de curtidas e comentários.`, "info");
    } catch {
      /* API indisponível: tenta de novo no próximo ciclo */
    }
  }, []);

  // Lista local sempre em dia com o que está salvo (inclusive alterações feitas em outra aba).
  useEffect(() => {
    if (!comAtividade || !idUsuario) {
      setAtividade([]);
      return;
    }
    const sincronizar = () => setAtividade(listarAtividade(idUsuario));
    sincronizar();
    const aoMudarStorage = (e: StorageEvent) => {
      if (e.key === `pitcherx:atividade:${idUsuario}`) sincronizar();
    };
    window.addEventListener(EVENTO_ATIVIDADE, sincronizar);
    window.addEventListener("storage", aoMudarStorage);
    return () => {
      window.removeEventListener(EVENTO_ATIVIDADE, sincronizar);
      window.removeEventListener("storage", aoMudarStorage);
    };
  }, [comAtividade, idUsuario]);

  useEffect(() => {
    if (!idUsuario) return;
    let cancelado = false;
    const tick = () => {
      if (cancelado || document.visibilityState !== "visible") return;
      atualizarNaoLidas();
      if (comAtividade) verificarAgora();
    };
    tick();
    const intervalo = window.setInterval(tick, INTERVALO_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      cancelado = true;
      window.clearInterval(intervalo);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [idUsuario, comAtividade, atualizarNaoLidas, verificarAgora]);

  const definirNaoLidas = useCallback((valor: number | ((atual: number) => number)) => {
    setNaoLidas((atual) => Math.max(0, typeof valor === "function" ? valor(atual ?? 0) : valor));
  }, []);

  const marcarAtividadeLida = useCallback((ids?: string[]) => {
    const id = idRef.current;
    if (id) marcarAtividadeComoLida(id, ids);
  }, []);

  const naoLidasAtividade = atividade.filter((n) => !n.lida).length;
  const naoLidas = idUsuario ? (naoLidasServidor === null && naoLidasAtividade === 0 ? null : (naoLidasServidor ?? 0) + naoLidasAtividade) : null;

  const value = useMemo(
    () => ({
      naoLidas,
      atualizarNaoLidas,
      definirNaoLidas,
      atividade: comAtividade ? atividade : [],
      verificarAgora,
      marcarAtividadeLida,
    }),
    [naoLidas, atualizarNaoLidas, definirNaoLidas, comAtividade, atividade, verificarAgora, marcarAtividadeLida]
  );

  return <NotificacoesContext.Provider value={value}>{children}</NotificacoesContext.Provider>;
}

export function useNotificacoes() {
  const ctx = useContext(NotificacoesContext);
  if (!ctx) throw new Error("useNotificacoes precisa ser usado dentro de um NotificacoesProvider");
  return ctx;
}
