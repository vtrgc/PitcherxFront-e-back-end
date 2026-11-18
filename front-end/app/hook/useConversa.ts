"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, NetworkError, mensagemErro } from "../lib/api";
import { gerarChaveCliente, mesclarMensagens } from "../lib/mensagens";
import {
  apagarMensagem,
  buscarMensagens,
  editarMensagem,
  enviarMensagem,
  marcarConversaComoLida,
} from "../services/mensagem.service";
import { Mensagem, MensagemNaTela } from "../types/Mensagem";
import { useAtualizacaoPeriodica } from "./useAtualizacaoPeriodica";

/** Intervalo da atualização da conversa aberta (só busca o que mudou). */
const INTERVALO_CONVERSA_MS = 3_000;

interface Opcoes {
  /** null = conversa nova (ainda sem mensagens): o primeiro envio cria a conversa. */
  conversaId: number | null;
  destinatarioId: number | null;
  idUsuario: number | null;
  /** Chamado depois de marcar mensagens como lidas (atualiza contadores). */
  aoLer?: (conversaId: number) => void;
  /** Chamado quando um envio é confirmado (com o id da conversa, que pode ser nova). */
  aoEnviar?: (mensagem: Mensagem) => void;
  /** O servidor recusou um envio por falta de conexão: a tela recarrega a situação. */
  aoBloquear?: () => void;
  /** Algo mudou na conversa (mensagem nova, editada, apagada): a lista atualiza a prévia. */
  aoMudar?: () => void;
}

export function useConversa({ conversaId, destinatarioId, idUsuario, aoLer, aoEnviar, aoBloquear, aoMudar }: Opcoes) {
  const [mensagens, setMensagens] = useState<MensagemNaTela[]>([]);
  const [carregando, setCarregando] = useState(!!conversaId);
  const [erro, setErro] = useState("");
  const [semConexao, setSemConexao] = useState(false);
  const [temMais, setTemMais] = useState(false);
  const [carregandoAnteriores, setCarregandoAnteriores] = useState(false);
  const cursorRef = useRef<string>("");
  const conversaRef = useRef(conversaId);
  const callbacks = useRef({ aoLer, aoEnviar, aoBloquear, aoMudar });
  useEffect(() => {
    callbacks.current = { aoLer, aoEnviar, aoBloquear, aoMudar };
  }, [aoLer, aoEnviar, aoBloquear, aoMudar]);
  // Espelho do estado para saber, fora do setState, se uma atualização trouxe novidade.
  const mensagensRef = useRef<MensagemNaTela[]>([]);
  useEffect(() => {
    mensagensRef.current = mensagens;
  }, [mensagens]);

  /** Marca como lidas as recebidas (só com a aba visível: quem não está vendo não leu). */
  const lerSePreciso = useCallback(async (lista: Mensagem[], id: number) => {
    if (document.visibilityState !== "visible") return;
    if (!lista.some((m) => !m.minha && !m.lida && !m.excluida)) return;
    try {
      await marcarConversaComoLida(id);
      callbacks.current.aoLer?.(id);
    } catch {
      /* tenta de novo na próxima atualização */
    }
  }, []);

  // Carga inicial. Quem usa o hook recria o componente (key) ao trocar de conversa, então o
  // estado já começa limpo.
  useEffect(() => {
    conversaRef.current = conversaId;
    if (!conversaId) return;
    const controle = new AbortController();
    buscarMensagens(conversaId, { signal: controle.signal })
      .then((r) => {
        if (conversaRef.current !== conversaId) return;
        setMensagens(r.mensagens);
        setTemMais(r.temMais);
        cursorRef.current = r.cursor;
        lerSePreciso(r.mensagens, conversaId);
      })
      .catch((e) => {
        if (controle.signal.aborted) return;
        setErro(mensagemErro(e, "Não foi possível carregar a conversa."));
      })
      .finally(() => {
        if (!controle.signal.aborted) setCarregando(false);
      });
    return () => controle.abort();
  }, [conversaId, lerSePreciso]);

  // Atualização automática: só o que mudou desde o último cursor.
  const atualizar = useCallback(async () => {
    const id = conversaRef.current;
    if (!id || !cursorRef.current) return;
    try {
      const r = await buscarMensagens(id, { desde: cursorRef.current });
      if (conversaRef.current !== id) return;
      setSemConexao(false);
      if (r.temMais) {
        // Mudou mais do que cabe numa resposta: recarrega o trecho mais recente.
        const completo = await buscarMensagens(id);
        setMensagens((atuais) => mesclarMensagens(atuais.filter((m) => m.estadoEnvio), completo.mensagens));
        cursorRef.current = completo.cursor;
        lerSePreciso(completo.mensagens, id);
        return;
      }
      cursorRef.current = r.cursor;
      if (r.mensagens.length) {
        const novidade = mesclarMensagens(mensagensRef.current, r.mensagens) !== mensagensRef.current;
        setMensagens((atuais) => mesclarMensagens(atuais, r.mensagens));
        lerSePreciso(r.mensagens, id);
        if (novidade) callbacks.current.aoMudar?.();
      }
    } catch (e) {
      if (e instanceof NetworkError || (e instanceof ApiError && e.status >= 500)) setSemConexao(true);
    }
  }, [lerSePreciso]);
  useAtualizacaoPeriodica(atualizar, INTERVALO_CONVERSA_MS, !!conversaId && !carregando && !erro);

  const carregarAnteriores = useCallback(async () => {
    const id = conversaRef.current;
    const primeira = mensagens.find((m) => !m.estadoEnvio);
    if (!id || !primeira || carregandoAnteriores) return;
    setCarregandoAnteriores(true);
    try {
      const r = await buscarMensagens(id, { antesDe: primeira.idMensagem });
      if (conversaRef.current !== id) return;
      setMensagens((atuais) => mesclarMensagens(atuais, r.mensagens));
      setTemMais(r.temMais);
    } catch (e) {
      setErro(mensagemErro(e, "Não foi possível carregar as mensagens anteriores."));
    } finally {
      setCarregandoAnteriores(false);
    }
  }, [mensagens, carregandoAnteriores]);

  /** Envia (ou reenvia, com a mesma chave) uma mensagem. Devolve true se o servidor confirmou. */
  const transmitir = useCallback(
    async (conteudo: string, chave: string) => {
      if (!destinatarioId) return false;
      setMensagens((atuais) => atuais.map((m) => (m.chaveCliente === chave ? { ...m, estadoEnvio: "enviando", erroEnvio: undefined } : m)));
      try {
        const confirmada = await enviarMensagem(destinatarioId, conteudo, chave);
        setMensagens((atuais) => mesclarMensagens(atuais.filter((m) => m.chaveCliente !== chave), [confirmada]));
        callbacks.current.aoEnviar?.(confirmada);
        return true;
      } catch (e) {
        const bloqueado = e instanceof ApiError && e.status === 403;
        const motivo = bloqueado
          ? e.payload?.message || "Não é possível enviar mensagens nesta conversa."
          : e instanceof NetworkError
            ? "Sem conexão com o servidor."
            : mensagemErro(e, "Não foi possível enviar.");
        setMensagens((atuais) => atuais.map((m) => (m.chaveCliente === chave ? { ...m, estadoEnvio: "falhou", erroEnvio: motivo } : m)));
        if (bloqueado) callbacks.current.aoBloquear?.();
        return false;
      }
    },
    [destinatarioId]
  );

  const enviar = useCallback(
    (texto: string) => {
      const conteudo = texto.trim();
      if (!conteudo || !destinatarioId) return Promise.resolve(false);
      const chave = gerarChaveCliente();
      const otimista: MensagemNaTela = {
        idMensagem: -Date.now(),
        conversaId: conversaRef.current ?? 0,
        remetenteId: idUsuario ?? 0,
        conteudo,
        dataEnvio: new Date().toISOString(),
        lida: false,
        dataLeitura: null,
        dataEdicao: null,
        excluida: false,
        minha: true,
        chaveCliente: chave,
        estadoEnvio: "enviando",
      };
      setMensagens((atuais) => [...atuais, otimista]);
      return transmitir(conteudo, chave);
    },
    [destinatarioId, idUsuario, transmitir]
  );

  const reenviar = useCallback(
    (chave: string) => {
      const m = mensagens.find((x) => x.chaveCliente === chave);
      return m?.conteudo ? transmitir(m.conteudo, chave) : Promise.resolve(false);
    },
    [mensagens, transmitir]
  );

  const descartar = useCallback((chave: string) => {
    setMensagens((atuais) => atuais.filter((m) => m.chaveCliente !== chave));
  }, []);

  const editar = useCallback(async (mensagemId: number, texto: string) => {
    const atualizada = await editarMensagem(mensagemId, texto.trim());
    setMensagens((atuais) => mesclarMensagens(atuais, [atualizada]));
    callbacks.current.aoMudar?.();
  }, []);

  const apagar = useCallback(async (mensagemId: number) => {
    await apagarMensagem(mensagemId);
    setMensagens((atuais) =>
      atuais.map((m) => (m.idMensagem === mensagemId ? { ...m, excluida: true, conteudo: null } : m))
    );
    callbacks.current.aoMudar?.();
  }, []);

  return {
    mensagens,
    carregando,
    erro,
    semConexao,
    temMais,
    carregandoAnteriores,
    carregarAnteriores,
    enviar,
    reenviar,
    descartar,
    editar,
    apagar,
  };
}
