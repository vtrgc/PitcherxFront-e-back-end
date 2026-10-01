import { api } from "../lib/api";
import { ContraProposta, ContraPropostaRequest } from "../types/ContraProposta";

export function listarContraPropostas() {
  return api<ContraProposta[]>("/contra-proposta");
}

export function buscarContraProposta(id: number) {
  return api<ContraProposta>(`/contra-proposta/${id}`);
}

export function criarContraProposta(data: ContraPropostaRequest) {
  return api<ContraProposta>("/contra-proposta", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function atualizarContraProposta(id: number, data: ContraPropostaRequest) {
  return api<ContraProposta>(`/contra-proposta/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function excluirContraProposta(id: number) {
  return api<void>(`/contra-proposta/${id}`, {
    method: "DELETE",
  });
}
