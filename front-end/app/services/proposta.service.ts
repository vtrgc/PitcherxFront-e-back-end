import { api } from "../lib/api";
import { Proposta, PropostaRequest } from "../types/Proposta";

export function listarPropostas() {
  return api<Proposta[]>("/proposta");
}

export function buscarProposta(id: number) {
  return api<Proposta>(`/proposta/${id}`);
}

export function criarProposta(data: PropostaRequest) {
  return api<Proposta>("/proposta", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function atualizarProposta(id: number, data: PropostaRequest) {
  return api<Proposta>(`/proposta/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function excluirProposta(id: number) {
  return api<void>(`/proposta/${id}`, {
    method: "DELETE",
  });
}
