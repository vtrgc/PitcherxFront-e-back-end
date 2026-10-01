"use client";

import { useCallback, useEffect, useState } from "react";

import { Usuario } from "../types/Usuario";
import { Projeto } from "../types/Projeto";
import { Post } from "../types/Post";
import { Comentario } from "../types/Comentario";
import { Proposta } from "../types/Proposta";
import { Contrato } from "../types/Contrato";
import { TipoProjeto } from "../types/TipoProjeto";
import { ProjetoUsuario } from "../types/ProjetoUsuario";

import { listarUsuarios } from "../services/usuario.service";
import { listarProjetos } from "../services/projeto.service";
import { listarPostagens } from "../services/postagem.service";
import { listarComentarios } from "../services/comentario.service";
import { listarPropostas } from "../services/proposta.service";
import { listarContratos } from "../services/contrato.service";
import { listarTiposProjeto } from "../services/tipoProjeto.service";
import { listarPorProjeto } from "../services/projetoUsuario.service";
import { buscarContagemCurtidas, TIPO_CONTEUDO } from "../services/curtida.service";
import { mapComLimite, mensagemErro } from "../lib/api";

interface AgregadoIndisponivel {
  total: number;
  carregando: boolean;
  indisponivel: boolean;
}

interface AgregadoConexoes extends AgregadoIndisponivel {

  itens: ProjetoUsuario[];
}

export interface DashboardData {
  carregando: boolean;
  erro: string;

  usuarios: Usuario[];
  projetos: Projeto[];
  postagens: Post[];
  comentarios: Comentario[];
  propostas: Proposta[];
  contratos: Contrato[];
  tiposProjeto: TipoProjeto[];

  conexoes: AgregadoConexoes;

  curtidasPostagens: AgregadoIndisponivel;

  /** Curtidas reais (tabela `curtida`) por comentário; o campo likeComentario do DTO vem sempre nulo. */
  curtidasComentarios: AgregadoIndisponivel & { porComentario: Map<number, number> };

  recarregar: () => void;
}

export function useDashboardData(): DashboardData {
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [postagens, setPostagens] = useState<Post[]>([]);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [tiposProjeto, setTiposProjeto] = useState<TipoProjeto[]>([]);

  const [conexoes, setConexoes] = useState<AgregadoConexoes>({
    total: 0,
    carregando: true,
    indisponivel: false,
    itens: [],
  });
  const [curtidasPostagens, setCurtidasPostagens] = useState<AgregadoIndisponivel>({
    total: 0,
    carregando: true,
    indisponivel: false,
  });

  const [curtidasComentarios, setCurtidasComentarios] = useState<
    AgregadoIndisponivel & { porComentario: Map<number, number> }
  >({ total: 0, carregando: true, indisponivel: false, porComentario: new Map() });

  const [tick, setTick] = useState(0);

  const carregarPrincipal = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const [
        dadosUsuarios,
        dadosProjetos,
        dadosPostagens,
        dadosComentarios,
        dadosPropostas,
        dadosContratos,
        dadosTipos,
      ] = await Promise.all([
        listarUsuarios(),
        listarProjetos(),
        listarPostagens(),
        listarComentarios(),
        listarPropostas().catch(() => []),
        listarContratos().catch(() => []),
        listarTiposProjeto().catch(() => []),
      ]);

      setUsuarios(dadosUsuarios);
      setProjetos(dadosProjetos);
      setPostagens(dadosPostagens);
      setComentarios(dadosComentarios);
      setPropostas(dadosPropostas);
      setContratos(dadosContratos);
      setTiposProjeto(dadosTipos);
    } catch (error) {
      setErro(mensagemErro(error, "Não foi possível carregar os dados administrativos."));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarPrincipal();
  }, [carregarPrincipal, tick]);

  useEffect(() => {
    let ativo = true;

    async function carregarConexoes() {
      if (carregando) return;

      if (projetos.length === 0) {
        if (ativo) setConexoes({ total: 0, carregando: false, indisponivel: false, itens: [] });
        return;
      }

      setConexoes((atual) => ({ ...atual, carregando: true }));
      const resultados = await mapComLimite(projetos, 6, (p) => listarPorProjeto(p.idProjeto));
      const sucesso = resultados.filter(
        (r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof listarPorProjeto>>> => r.status === "fulfilled"
      );

      if (!ativo) return;

      if (sucesso.length === 0) {
        setConexoes({ total: 0, carregando: false, indisponivel: true, itens: [] });
        return;
      }

      const itens = sucesso.flatMap((r) => r.value);
      setConexoes({ total: itens.length, carregando: false, indisponivel: false, itens });
    }

    carregarConexoes();
    return () => {
      ativo = false;
    };

  }, [carregando, projetos]);

  useEffect(() => {
    let ativo = true;

    async function carregarCurtidas() {
      if (carregando) return;

      if (postagens.length === 0) {
        if (ativo) setCurtidasPostagens({ total: 0, carregando: false, indisponivel: false });
        return;
      }

      setCurtidasPostagens((atual) => ({ ...atual, carregando: true }));
      const resultados = await mapComLimite(postagens, 6, (p) =>
        buscarContagemCurtidas(TIPO_CONTEUDO.POSTAGEM, p.idPostagem)
      );
      const sucesso = resultados.filter((r): r is PromiseFulfilledResult<number> => r.status === "fulfilled");

      if (!ativo) return;

      if (sucesso.length === 0) {
        setCurtidasPostagens({ total: 0, carregando: false, indisponivel: true });
        return;
      }

      const total = sucesso.reduce((acc, r) => acc + (r.value || 0), 0);
      setCurtidasPostagens({ total, carregando: false, indisponivel: false });
    }

    carregarCurtidas();
    return () => {
      ativo = false;
    };

  }, [carregando, postagens]);

  useEffect(() => {
    let ativo = true;

    async function carregarCurtidasComentarios() {
      if (carregando) return;
      if (comentarios.length === 0) {
        if (ativo) setCurtidasComentarios({ total: 0, carregando: false, indisponivel: false, porComentario: new Map() });
        return;
      }
      setCurtidasComentarios((atual) => ({ ...atual, carregando: true }));
      const resultados = await mapComLimite(comentarios, 6, (c) =>
        buscarContagemCurtidas(TIPO_CONTEUDO.COMENTARIO, c.idComentario)
      );
      if (!ativo) return;
      const porComentario = new Map<number, number>();
      let total = 0;
      let sucesso = 0;
      resultados.forEach((r, i) => {
        if (r.status === "fulfilled") {
          sucesso++;
          total += r.value || 0;
          porComentario.set(comentarios[i].idComentario, r.value || 0);
        }
      });
      setCurtidasComentarios({ total, carregando: false, indisponivel: sucesso === 0, porComentario });
    }

    carregarCurtidasComentarios();
    return () => {
      ativo = false;
    };
  }, [carregando, comentarios]);

  const recarregar = useCallback(() => setTick((t) => t + 1), []);

  return {
    carregando,
    erro,
    usuarios,
    projetos,
    postagens,
    comentarios,
    propostas,
    contratos,
    tiposProjeto,
    conexoes,
    curtidasPostagens,
    curtidasComentarios,
    recarregar,
  };
}
