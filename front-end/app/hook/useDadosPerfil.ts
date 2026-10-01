"use client";

import { useCallback, useEffect, useState } from "react";
import { mensagemErro } from "../lib/api";
import { buscarPerfilDoUsuario } from "../services/perfilUsuario.service";
import { listarEnderecos } from "../services/endereco.service";
import { PerfilUsuario } from "../types/PerfilUsuario";
import { Endereco } from "../types/Endereco";

/**
 * Perfil profissional (PerfilUsuario) e endereço de um usuário.
 *
 * O backend não tem busca "por usuário" para nenhum dos dois: os serviços existentes
 * filtram as listagens `GET /perfil-usuario` e `GET /endereco`. Os dados vêm sempre da
 * API (nada é lido de armazenamento local).
 */
export function useDadosPerfil(idUsuario: number | undefined | null) {
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [endereco, setEndereco] = useState<Endereco | null>(null);
  const [carregandoEstado, setCarregando] = useState(true);
  // Id cujos dados já foram buscados. Enquanto o id atual não tiver sido carregado, o hook
  // informa "carregando" — inclusive no render em que o id acabou de mudar (antes do efeito
  // rodar). Sem isso, quem espera `!carregando` via um estado "vazio" momentâneo.
  const [idCarregado, setIdCarregado] = useState<number | null>(null);
  const [erro, setErro] = useState("");
  const [erroEndereco, setErroEndereco] = useState("");

  const idValido = !!idUsuario && Number.isFinite(idUsuario);
  const carregando = carregandoEstado || (idValido && idCarregado !== idUsuario);

  const carregar = useCallback(async () => {
    if (!idUsuario || !Number.isFinite(idUsuario)) {
      setCarregando(false);
      return;
    }
    setCarregando(true);
    setErro("");
    setErroEndereco("");
    const [rPerfil, rEnderecos] = await Promise.allSettled([buscarPerfilDoUsuario(idUsuario), listarEnderecos()]);
    if (rPerfil.status === "fulfilled") setPerfil(rPerfil.value);
    else setErro(mensagemErro(rPerfil.reason, "Não foi possível carregar as informações profissionais."));
    if (rEnderecos.status === "fulfilled") {
      // Se houver mais de um endereço para o usuário, usa o mais recente.
      const doUsuario = (rEnderecos.value ?? [])
        .filter((e) => e.usuarioId === idUsuario)
        .sort((a, b) => b.idEndereco - a.idEndereco);
      setEndereco(doUsuario[0] ?? null);
    } else {
      setErroEndereco(mensagemErro(rEnderecos.reason, "Não foi possível carregar a localização."));
    }
    setIdCarregado(idUsuario);
    setCarregando(false);
  }, [idUsuario]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { perfil, setPerfil, endereco, setEndereco, carregando, erro, erroEndereco, recarregar: carregar };
}
