import { api } from "../lib/api";
import { SolicitacaoVinculo } from "../types/SolicitacaoVinculo";

export function listarSolicitacoesDoProjeto(projetoId: number) {
  return api<SolicitacaoVinculo[]>(`/solicitacao-vinculo/projeto/${projetoId}`);
}

export function listarSolicitacoesPendentes(projetoId: number) {
  return api<SolicitacaoVinculo[]>(`/solicitacao-vinculo/projeto/${projetoId}/pendentes`);
}

/** Solicitações feitas pelo usuário logado. */
export function listarMinhasSolicitacoes() {
  return api<SolicitacaoVinculo[]>("/solicitacao-vinculo/minhas-solicitacoes");
}

/** POST /solicitacao-vinculo/projeto/{projetoId} — exige ter aceitado os termos do projeto. */
export function solicitarVinculo(projetoId: number, tipoVinculoDesejadoId: number) {
  return api<SolicitacaoVinculo>(`/solicitacao-vinculo/projeto/${projetoId}`, {
    method: "POST",
    body: JSON.stringify({ tipoVinculoDesejadoId }),
  });
}

/** Somente o criador do projeto: o servidor confere `usuarioIdCriador`. */
export function aprovarSolicitacao(idSolicitacao: number, usuarioIdCriador: number) {
  return api<SolicitacaoVinculo>(`/solicitacao-vinculo/${idSolicitacao}/aprovar?usuarioIdCriador=${usuarioIdCriador}`, { method: "PUT" });
}

export function rejeitarSolicitacao(idSolicitacao: number, usuarioIdCriador: number) {
  return api<SolicitacaoVinculo>(`/solicitacao-vinculo/${idSolicitacao}/rejeitar?usuarioIdCriador=${usuarioIdCriador}`, { method: "PUT" });
}
