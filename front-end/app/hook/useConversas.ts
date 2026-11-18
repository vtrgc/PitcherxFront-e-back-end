"use client";

import { useCallback, useRef, useState } from "react";
import { ApiError, mensagemErro } from "../lib/api";
import { listarConversas } from "../services/mensagem.service";
import { Conversa } from "../types/Mensagem";
import { useAtualizacaoPeriodica } from "./useAtualizacaoPeriodica";

/** Lista de conversas: a primeira carga mostra carregamento; as seguintes atualizam em silêncio. */
const INTERVALO_LISTA_MS = 10_000;

export function useConversas() {
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  /** Falha numa atualização automática (a lista anterior continua na tela). */
  const [semConexao, setSemConexao] = useState(false);
  const carregouRef = useRef(false);

  const carregar = useCallback(async () => {
    try {
      const lista = await listarConversas();
      setConversas(lista);
      setErro("");
      setSemConexao(false);
      carregouRef.current = true;
    } catch (e) {
      if (!carregouRef.current) setErro(mensagemErro(e, "Não foi possível carregar suas conversas."));
      else if (!(e instanceof ApiError)) setSemConexao(true);
    } finally {
      setCarregando(false);
    }
  }, []);

  // Primeira carga já no início; depois, atualização periódica com a aba visível.
  useAtualizacaoPeriodica(carregar, INTERVALO_LISTA_MS, true, true);

  const recarregar = useCallback(async () => {
    if (!carregouRef.current) setCarregando(true);
    await carregar();
  }, [carregar]);

  /** Zera o contador de uma conversa logo depois de marcá-la como lida. */
  const zerarNaoLidas = useCallback((conversaId: number) => {
    setConversas((lista) => lista.map((c) => (c.idConversa === conversaId && c.naoLidas ? { ...c, naoLidas: 0 } : c)));
  }, []);

  return { conversas, carregando, erro, semConexao, recarregar, zerarNaoLidas };
}
