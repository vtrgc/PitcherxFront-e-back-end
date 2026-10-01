"use client";

import { useState, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { curtirConteudo, descurtirConteudo, buscarStatusCurtida, TIPO_CONTEUDO } from "../services/curtida.service";
import { mensagemErro } from "../lib/api";
import { useFeedback } from "../components/ui/FeedbackProvider";

/** Estado de curtida de um conteúdo (postagem, comentário, subcomentário ou projeto). */
export function useCurtida(
  tipoConteudo: keyof typeof TIPO_CONTEUDO,
  conteudoId: number,
  inicial?: { curtido?: boolean; total?: number }
) {
  const { usuario } = useAuth();
  const { notificar } = useFeedback();
  const [curtido, setCurtido] = useState(inicial?.curtido ?? false);
  const [totalCurtidas, setTotalCurtidas] = useState(inicial?.total ?? 0);
  const [carregando, setCarregando] = useState(inicial?.curtido === undefined);
  const [enviando, setEnviando] = useState(false);
  const enviandoRef = useRef(false);

  const tipoConteudoId = TIPO_CONTEUDO[tipoConteudo];

  const carregar = useCallback(async () => {
    if (!usuario) {
      setCarregando(false);
      return;
    }
    try {
      const status = await buscarStatusCurtida(usuario.idUsuario, tipoConteudoId, conteudoId);
      setTotalCurtidas(status.quantidadeCurtidas);
      setCurtido(status.jaCurtiu);
    } catch {
      /* contagem indisponível: mantém zero sem travar a interface */
    } finally {
      setCarregando(false);
    }
  }, [usuario, tipoConteudoId, conteudoId]);

  const alternarCurtida = useCallback(async () => {
    if (!usuario || enviandoRef.current) return;
    enviandoRef.current = true;
    setEnviando(true);
    const estadoAnterior = curtido;
    const totalAnterior = totalCurtidas;
    // Atualização otimista, revertida em caso de erro.
    setCurtido(!estadoAnterior);
    setTotalCurtidas(Math.max(0, totalAnterior + (estadoAnterior ? -1 : 1)));
    try {
      if (estadoAnterior) {
        await descurtirConteudo(usuario.idUsuario, tipoConteudoId, conteudoId);
      } else {
        await curtirConteudo(usuario.idUsuario, tipoConteudoId, conteudoId);
      }
    } catch (error) {
      setCurtido(estadoAnterior);
      setTotalCurtidas(totalAnterior);
      notificar(mensagemErro(error, "Não foi possível registrar a curtida."));
      // Sincroniza com o servidor (ex.: curtida já existia em outra aba).
      carregar();
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  }, [usuario, curtido, totalCurtidas, tipoConteudoId, conteudoId, notificar, carregar]);

  return {
    curtido,
    totalCurtidas,
    carregando,
    enviando,
    carregar,
    alternarCurtida,
  };
}
