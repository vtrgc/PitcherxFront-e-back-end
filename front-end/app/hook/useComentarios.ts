"use client";

import { useCallback, useEffect, useState } from "react";
import { Comentario } from "../types/Comentario";
import { listarComentarios } from "../services/comentario.service";
import { mensagemErro } from "../lib/api";

/**
 * Comentários de uma postagem. A API só oferece a listagem geral (/comentario),
 * então filtramos por postagem no cliente.
 */
export function useComentarios(postagemId?: number, { automatico = true }: { automatico?: boolean } = {}) {
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [loading, setLoading] = useState(automatico);
  const [carregado, setCarregado] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro("");
    try {
      const dados = (await listarComentarios()) ?? [];
      const filtrados = postagemId === undefined ? dados : dados.filter((c) => c.postagemId === postagemId);
      setComentarios(filtrados.sort((a, b) => a.idComentario - b.idComentario));
      setCarregado(true);
    } catch (error) {
      setErro(mensagemErro(error, "Não foi possível carregar os comentários."));
    } finally {
      setLoading(false);
    }
  }, [postagemId]);

  useEffect(() => {
    if (automatico) carregar();
  }, [automatico, carregar]);

  return {
    comentarios,
    loading,
    carregado,
    erro,
    atualizar: carregar,
  };
}
