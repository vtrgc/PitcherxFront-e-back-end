import { api } from "../lib/api";
import { ContraProposta, ContraPropostaRequest, DecisaoContraProposta } from "../types/ContraProposta";

export function listarContraPropostas() {
  return api<ContraProposta[]>("/contra-proposta");
}

/** GET /contra-proposta/projeto/{projetoId}. */
export function listarContraPropostasDoProjeto(projetoId: number) {
  return api<ContraProposta[]>(`/contra-proposta/projeto/${projetoId}`);
}

/** GET /contra-proposta/me/criadas — as que eu (dono de projeto) enviei. */
export function listarContraPropostasCriadas() {
  return api<ContraProposta[]>("/contra-proposta/me/criadas");
}

/** GET /contra-proposta/me/recebidas — as feitas sobre propostas que eu enviei. */
export function listarContraPropostasRecebidas() {
  return api<ContraProposta[]>("/contra-proposta/me/recebidas");
}

export function buscarContraProposta(id: number) {
  return api<ContraProposta>(`/contra-proposta/${id}`);
}

/** POST /contra-proposta — só o criador do projeto da proposta. */
export function criarContraProposta(data: ContraPropostaRequest) {
  return api<ContraProposta>("/contra-proposta", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** PUT /contra-proposta/{id} — só quem criou, e enquanto estiver PENDENTE. */
export function atualizarContraProposta(id: number, data: ContraPropostaRequest) {
  return api<ContraProposta>(`/contra-proposta/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/** PUT /contra-proposta/{id}/aceitar — só o autor da proposta original. */
export function aceitarContraProposta(id: number) {
  const corpo: DecisaoContraProposta = { status: "ACEITA" };
  return api<ContraProposta>(`/contra-proposta/${id}/aceitar`, { method: "PUT", body: JSON.stringify(corpo) });
}

/** PUT /contra-proposta/{id}/rejeitar — justificativa obrigatória. */
export function rejeitarContraProposta(id: number, justificativa: string) {
  const corpo: DecisaoContraProposta = { status: "REJEITADA", justificativa };
  return api<ContraProposta>(`/contra-proposta/${id}/rejeitar`, { method: "PUT", body: JSON.stringify(corpo) });
}

/** DELETE /contra-proposta/{id} — quem criou ou ADMIN. */
export function excluirContraProposta(id: number) {
  return api<void>(`/contra-proposta/${id}`, {
    method: "DELETE",
  });
}
