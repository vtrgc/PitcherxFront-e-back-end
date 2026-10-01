"use client";

import { useCallback, useEffect, useState } from "react";
import { Usuario } from "../types/Usuario";
import { buscarUsuario } from "../services/usuario.service";
import { buscarPerfilDoUsuario } from "../services/perfilUsuario.service";
import { ApiError } from "../lib/api";
import { useAuth } from "../context/AuthContext";

/**
 * Dados públicos de um usuário (autor de post/comentário, perfil público...).
 * Usa GET /usuario/{id} (com cache) e, se falhar, tenta montar o básico a partir
 * da listagem de perfis (/perfil-usuario), que também expõe nome e e-mail.
 */
export function useUsuario(id: number) {
  const { usuario: usuarioLogado } = useAuth();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [indisponivel, setIndisponivel] = useState(false);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  const idLogado = usuarioLogado?.idUsuario;
  const ehProprio = !!idLogado && idLogado === id;
  // Para o próprio usuário, reflete edições locais (nome/foto) imediatamente.
  const fotoLocal = ehProprio ? usuarioLogado?.urlImagemUsuario : undefined;
  const nomeLocal = ehProprio ? usuarioLogado?.nomeUsuario : undefined;

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      setLoading(true);
      setIndisponivel(false);
      setNaoEncontrado(false);

      try {
        const dados = await buscarUsuario(id, { forcar: tentativa > 0 });
        if (ativo) setUsuario(dados);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          if (ativo) setNaoEncontrado(true);
        }
        try {
          const perfil = await buscarPerfilDoUsuario(id);
          if (ativo && perfil) {
            setUsuario({
              idUsuario: perfil.usuario.idUsuario,
              nomeUsuario: perfil.usuario.nomeUsuario,
              emailUsuario: perfil.usuario.emailUsuario,
              telefoneUsuario: null,
              urlImagemUsuario: null,
              active: perfil.usuario.active,
              roles: [],
            });
            setNaoEncontrado(false);
          } else if (ativo) {
            setIndisponivel(true);
          }
        } catch {
          if (ativo) setIndisponivel(true);
        }
      } finally {
        if (ativo) setLoading(false);
      }
    }

    if (id && Number.isFinite(id)) {
      carregar();
    } else {
      setLoading(false);
      setIndisponivel(true);
      setNaoEncontrado(true);
    }

    return () => {
      ativo = false;
    };
  }, [id, tentativa]);

  /** Nova tentativa após falha (ignora o cache). */
  const recarregar = useCallback(() => setTentativa((t) => t + 1), []);

  const usuarioFinal =
    usuario && ehProprio
      ? {
          ...usuario,
          nomeUsuario: nomeLocal ?? usuario.nomeUsuario,
          urlImagemUsuario: fotoLocal !== undefined ? fotoLocal : usuario.urlImagemUsuario,
        }
      : usuario;

  return {
    usuario: usuarioFinal,
    loading,
    indisponivel,
    naoEncontrado,
    recarregar,
  };
}
