import { api } from "../lib/api";
import { Contrato, ContratoRequest } from "../types/Contrato";

export function listarContratos() {
  return api<Contrato[]>("/contrato");
}

export function buscarContrato(id: number) {
  return api<Contrato>(`/contrato/${id}`);
}

/** POST /contrato — com `propostaId`, o contrato nasce PENDENTE. */
export function criarContrato(data: ContratoRequest) {
  return api<Contrato>("/contrato", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function atualizarContrato(id: number, data: ContratoRequest) {
  return api<Contrato>(`/contrato/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * PUT /contrato/{id}/aceitar — PENDENTE → ACEITE; soma o valor da proposta ao arrecadado.
 * O backend libera ADMIN e USUARIO (cita "EMPRESARIO", role que não existe).
 */
export function aceitarContrato(id: number) {
  return api<Contrato>(`/contrato/${id}/aceitar`, { method: "PUT" });
}

export function excluirContrato(id: number) {
  return api<void>(`/contrato/${id}`, {
    method: "DELETE",
  });
}

/** Status legível do contrato. */
export function rotuloStatusContrato(status: string | null | undefined): string {
  if (status === "ACEITE") return "Aceito";
  if (status === "PENDENTE") return "Aguardando aceite";
  return "Sem proposta vinculada";
}
