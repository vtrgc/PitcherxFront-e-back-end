"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useFeedback } from "../components/ui/FeedbackProvider";
import { ApiError, mensagemErro } from "../lib/api";
import { RELACAO_VAZIA, RelacaoConexao, derivarRelacao } from "../lib/conexao";
import {
  EVENTO_CONEXOES_ALTERADAS,
  TAMANHO_LISTA_COMPLETA,
  aceitarConexao,
  buscarStatusConexao,
  contarSeguidores,
  contarSeguindo,
  descobrirIdConexao,
  listarSeguidores,
  listarSeguindo,
  listarSolicitacoesEnviadas,
  listarSolicitacoesPendentes,
  recusarConexao,
  removerConexao,
  solicitarConexao,
} from "../services/conexao.service";
import { ConexaoSimples } from "../types/Conexao";

export interface PessoaConexao {
  id: number;
  nome: string;
}

/** Recarrega quando qualquer tela altera uma conexão (evento disparado pelo service). */
function useAoAlterarConexoes(recarregar: () => void, ativo = true) {
  useEffect(() => {
    if (!ativo) return;
    window.addEventListener(EVENTO_CONEXOES_ALTERADAS, recarregar);
    return () => window.removeEventListener(EVENTO_CONEXOES_ALTERADAS, recarregar);
  }, [recarregar, ativo]);
}

const MSG_SEM_ID =
  "Não foi possível identificar esta conexão no servidor (a API não informa o ID dela nas listas). Use a solicitação correspondente em Notificações.";

/**
 * Ações de conexão com confirmação, mensagens e tratamento de erro padronizados.
 * Cada ação devolve true quando o servidor confirmou a operação.
 */
export function useAcoesConexao() {
  const { usuario } = useAuth();
  const { notificar, confirmar } = useFeedback();
  const eu = usuario?.idUsuario ?? null;

  const executar = useCallback(
    async (acao: () => Promise<unknown>, sucesso: string, falha: string) => {
      try {
        await acao();
        if (sucesso) notificar(sucesso, "sucesso");
        return true;
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
          // Estado mudou em outro lugar (ex.: solicitação já respondida): a tela recarrega.
          notificar(error.message || "Esta conexão já foi atualizada. Os dados foram recarregados.", "info");
          return true;
        }
        notificar(mensagemErro(error, falha));
        return false;
      }
    },
    [notificar]
  );

  const resolverId = useCallback(
    async (outro: PessoaConexao, sentido: "recebida" | "enviada") => {
      if (!eu) return null;
      try {
        const id = await descobrirIdConexao(eu, outro, sentido);
        if (id === null) notificar(MSG_SEM_ID, "info");
        return id;
      } catch (error) {
        notificar(mensagemErro(error, "Não foi possível consultar a conexão."));
        return null;
      }
    },
    [eu, notificar]
  );

  const seguir = useCallback(
    (outro: PessoaConexao) =>
      executar(() => solicitarConexao(outro.id), `Solicitação enviada para ${outro.nome}.`, "Não foi possível enviar a solicitação."),
    [executar]
  );

  const removerComConfirmacao = useCallback(
    async (outro: PessoaConexao, sentido: "recebida" | "enviada", textos: { pergunta: string; titulo: string; botao: string; sucesso: string }) => {
      if (!(await confirmar(textos.pergunta, { titulo: textos.titulo, confirmarLabel: textos.botao, cancelarLabel: "Voltar", perigo: true }))) return false;
      const id = await resolverId(outro, sentido);
      if (id === null) return false;
      return executar(() => removerConexao(id), textos.sucesso, "Não foi possível concluir a operação.");
    },
    [confirmar, resolverId, executar]
  );

  const deixarDeSeguir = useCallback(
    (outro: PessoaConexao) =>
      removerComConfirmacao(outro, "enviada", {
        pergunta: `Deixar de seguir ${outro.nome}?`,
        titulo: "Deixar de seguir",
        botao: "Deixar de seguir",
        sucesso: `Você deixou de seguir ${outro.nome}.`,
      }),
    [removerComConfirmacao]
  );

  const cancelarSolicitacao = useCallback(
    (outro: PessoaConexao) =>
      removerComConfirmacao(outro, "enviada", {
        pergunta: `Cancelar a solicitação enviada para ${outro.nome}?`,
        titulo: "Cancelar solicitação",
        botao: "Cancelar solicitação",
        sucesso: "Solicitação cancelada.",
      }),
    [removerComConfirmacao]
  );

  const removerSeguidor = useCallback(
    (outro: PessoaConexao) =>
      removerComConfirmacao(outro, "recebida", {
        pergunta: `Remover ${outro.nome} dos seus seguidores?`,
        titulo: "Remover seguidor",
        botao: "Remover",
        sucesso: `${outro.nome} não segue mais você.`,
      }),
    [removerComConfirmacao]
  );

  /** Aceita/recusa. Aceita o ID direto (notificação) ou descobre pelo nome da pessoa. */
  const responder = useCallback(
    async (alvo: PessoaConexao | { idConexao: number }, aceitar: boolean) => {
      const id = "idConexao" in alvo ? alvo.idConexao : await resolverId(alvo, "recebida");
      if (id === null) return false;
      return executar(
        () => (aceitar ? aceitarConexao(id) : recusarConexao(id)),
        aceitar ? "Solicitação aceita." : "Solicitação recusada.",
        aceitar ? "Não foi possível aceitar a solicitação." : "Não foi possível recusar a solicitação."
      );
    },
    [resolverId, executar]
  );

  return {
    eu,
    seguir,
    deixarDeSeguir,
    cancelarSolicitacao,
    removerSeguidor,
    aceitar: (alvo: PessoaConexao | { idConexao: number }) => responder(alvo, true),
    recusar: (alvo: PessoaConexao | { idConexao: number }) => responder(alvo, false),
  };
}

/** Contadores públicos de um perfil (seguidores/seguindo). */
export function useContadoresConexao(usuarioId: number | null | undefined) {
  const [seguidores, setSeguidores] = useState<number | null>(null);
  const [seguindo, setSeguindo] = useState<number | null>(null);
  const [erro, setErro] = useState(false);

  const carregar = useCallback(async () => {
    if (!usuarioId) return;
    setErro(false);
    const [a, b] = await Promise.allSettled([contarSeguidores(usuarioId), contarSeguindo(usuarioId)]);
    if (a.status === "fulfilled") setSeguidores(a.value);
    if (b.status === "fulfilled") setSeguindo(b.value);
    setErro(a.status === "rejected" || b.status === "rejected");
  }, [usuarioId]);

  useEffect(() => {
    carregar();
  }, [carregar]);
  useAoAlterarConexoes(carregar);

  return { seguidores, seguindo, erro, recarregar: carregar };
}

/**
 * Relação entre o usuário logado e outra pessoa (perfil).
 * Usa GET /conexao/status nos dois sentidos e, havendo pendência, as listas de
 * solicitações para saber quem pediu a quem.
 */
export function useRelacaoConexao(outro: PessoaConexao | null) {
  const { usuario } = useAuth();
  const eu = usuario?.idUsuario ?? null;
  const outroId = outro?.id ?? null;
  const [relacao, setRelacao] = useState<RelacaoConexao>(RELACAO_VAZIA);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const acoes = useAcoesConexao();

  const carregar = useCallback(async () => {
    if (!eu || !outroId || eu === outroId) {
      setCarregando(false);
      return;
    }
    setCarregando(true);
    setErro("");
    try {
      const [ida, volta] = await Promise.all([buscarStatusConexao(eu, outroId), buscarStatusConexao(outroId, eu)]);
      let pendentes = { enviadasPara: false, recebidasDe: false };
      if (ida.status === "PENDENTE" || volta.status === "PENDENTE") {
        const [enviadas, recebidas] = await Promise.all([
          listarSolicitacoesEnviadas(eu, 0, TAMANHO_LISTA_COMPLETA),
          listarSolicitacoesPendentes(eu, 0, TAMANHO_LISTA_COMPLETA),
        ]);
        pendentes = {
          enviadasPara: enviadas.itens.some((p) => p.id === outroId),
          recebidasDe: recebidas.itens.some((p) => p.id === outroId),
        };
      }
      setRelacao(derivarRelacao(ida, pendentes));
    } catch (error) {
      setErro(mensagemErro(error, "Não foi possível verificar a conexão."));
    } finally {
      setCarregando(false);
    }
  }, [eu, outroId]);

  useEffect(() => {
    carregar();
  }, [carregar]);
  useAoAlterarConexoes(carregar);

  const rodar = useCallback(
    async (fn: (p: PessoaConexao) => Promise<boolean>) => {
      if (!outro || enviando) return false;
      setEnviando(true);
      try {
        const ok = await fn(outro);
        await carregar();
        return ok;
      } finally {
        setEnviando(false);
      }
    },
    [outro, enviando, carregar]
  );

  return {
    relacao,
    carregando,
    erro,
    enviando,
    recarregar: carregar,
    seguir: () => rodar(acoes.seguir),
    deixarDeSeguir: () => rodar(acoes.deixarDeSeguir),
    cancelarSolicitacao: () => rodar(acoes.cancelarSolicitacao),
    removerSeguidor: () => rodar(acoes.removerSeguidor),
    aceitar: () => rodar(acoes.aceitar),
    recusar: () => rodar(acoes.recusar),
  };
}

export interface MinhasConexoes {
  seguidores: ConexaoSimples[];
  seguindo: ConexaoSimples[];
  recebidas: ConexaoSimples[];
  enviadas: ConexaoSimples[];
}

const VAZIO: MinhasConexoes = { seguidores: [], seguindo: [], recebidas: [], enviadas: [] };

/**
 * Conexões do usuário logado (quatro listas), para telas com vários botões de seguir
 * (Explorar, sugestões, página de conexões) sem uma requisição de status por pessoa.
 */
export function useMinhasConexoes({ automatico = true }: { automatico?: boolean } = {}) {
  const { usuario } = useAuth();
  const eu = usuario?.idUsuario ?? null;
  const [dados, setDados] = useState<MinhasConexoes>(VAZIO);
  const [carregando, setCarregando] = useState(automatico);
  const [erro, setErro] = useState("");
  const [ocupados, setOcupados] = useState<Set<number>>(new Set());
  const ocupadosRef = useRef(ocupados);
  const acoes = useAcoesConexao();

  const carregar = useCallback(async () => {
    if (!eu) return;
    setCarregando(true);
    setErro("");
    try {
      const [seguidores, seguindo, recebidas, enviadas] = await Promise.all([
        listarSeguidores(eu, 0, TAMANHO_LISTA_COMPLETA),
        listarSeguindo(eu, 0, TAMANHO_LISTA_COMPLETA),
        listarSolicitacoesPendentes(eu, 0, TAMANHO_LISTA_COMPLETA),
        listarSolicitacoesEnviadas(eu, 0, TAMANHO_LISTA_COMPLETA),
      ]);
      setDados({ seguidores: seguidores.itens, seguindo: seguindo.itens, recebidas: recebidas.itens, enviadas: enviadas.itens });
    } catch (error) {
      setErro(mensagemErro(error, "Não foi possível carregar suas conexões."));
    } finally {
      setCarregando(false);
    }
  }, [eu]);

  useEffect(() => {
    if (automatico) carregar();
  }, [automatico, carregar]);
  useAoAlterarConexoes(carregar, automatico);

  const conjuntos = useMemo(
    () => ({
      seguidores: new Set(dados.seguidores.map((p) => p.id)),
      seguindo: new Set(dados.seguindo.map((p) => p.id)),
      recebidas: new Set(dados.recebidas.map((p) => p.id)),
      enviadas: new Set(dados.enviadas.map((p) => p.id)),
    }),
    [dados]
  );

  const relacaoCom = useCallback(
    (id: number): RelacaoConexao => ({
      euSigo: conjuntos.seguindo.has(id),
      meSegue: conjuntos.seguidores.has(id),
      solicitacaoEnviada: conjuntos.enviadas.has(id),
      solicitacaoRecebida: conjuntos.recebidas.has(id),
    }),
    [conjuntos]
  );

  const rodar = useCallback(
    async (pessoa: PessoaConexao, fn: (p: PessoaConexao) => Promise<boolean>) => {
      if (ocupadosRef.current.has(pessoa.id)) return false;
      const marcar = (ativo: boolean) => {
        const novo = new Set(ocupadosRef.current);
        if (ativo) novo.add(pessoa.id);
        else novo.delete(pessoa.id);
        ocupadosRef.current = novo;
        setOcupados(novo);
      };
      marcar(true);
      try {
        const ok = await fn(pessoa);
        await carregar();
        return ok;
      } finally {
        marcar(false);
      }
    },
    [carregar]
  );

  return {
    ...dados,
    carregando,
    erro,
    recarregar: carregar,
    relacaoCom,
    ocupado: (id: number) => ocupados.has(id),
    seguir: (p: PessoaConexao) => rodar(p, acoes.seguir),
    deixarDeSeguir: (p: PessoaConexao) => rodar(p, acoes.deixarDeSeguir),
    cancelarSolicitacao: (p: PessoaConexao) => rodar(p, acoes.cancelarSolicitacao),
    removerSeguidor: (p: PessoaConexao) => rodar(p, acoes.removerSeguidor),
    aceitar: (p: PessoaConexao) => rodar(p, acoes.aceitar),
    recusar: (p: PessoaConexao) => rodar(p, acoes.recusar),
  };
}
