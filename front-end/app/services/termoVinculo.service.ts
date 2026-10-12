import { api } from "../lib/api";
import { ProjetoUsuario } from "../types/ProjetoUsuario";
import { TermoVinculo, TermoVinculoRequest } from "../types/TermoVinculo";

/** Todos os termos de vínculo (de todos os projetos). */
export function listarTermosVinculo() {
  return api<TermoVinculo[]>("/termo-vinculo");
}

export function listarTermosVinculoDoProjeto(projetoId: number) {
  return api<TermoVinculo[]>(`/termo-vinculo/projeto/${projetoId}`);
}

export function buscarTermoVinculo(id: number) {
  return api<TermoVinculo>(`/termo-vinculo/${id}`);
}

/** POST /termo-vinculo/projeto/{projetoId} — roles USUARIO/EMPRESA. */
export function criarTermoVinculo(projetoId: number, data: TermoVinculoRequest) {
  return api<TermoVinculo>(`/termo-vinculo/projeto/${projetoId}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function atualizarTermoVinculo(id: number, data: TermoVinculoRequest) {
  return api<TermoVinculo>(`/termo-vinculo/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function excluirTermoVinculo(id: number) {
  return api<void>(`/termo-vinculo/${id}`, {
    method: "DELETE",
  });
}

/** Monta a query de `termoIds`; lista vazia vira `termoIds=` (o servidor exige o parâmetro). */
export function queryTermosAceitos(termoIds: number[]): string {
  if (termoIds.length === 0) return "termoIds=";
  return termoIds.map((id) => `termoIds=${encodeURIComponent(id)}`).join("&");
}

/**
 * POST /termo-vinculo/projeto/{projetoId}/aceitar?termoIds=… — o usuário logado aceita os
 * termos e passa a ser VISUALIZADOR (ou tem o aceite registrado no vínculo que já possui).
 * Todos os termos obrigatórios precisam estar na lista.
 */
export function aceitarTermosVinculo(projetoId: number, termoIds: number[]) {
  return api<ProjetoUsuario>(`/termo-vinculo/projeto/${projetoId}/aceitar?${queryTermosAceitos(termoIds)}`, {
    method: "POST",
  });
}
