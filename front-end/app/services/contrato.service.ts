import { api } from "../lib/api";
import { Contrato, ContratoRequest } from "../types/Contrato";

export function listarContratos() {
  return api<Contrato[]>("/contrato");
}

export function buscarContrato(id: number) {
  return api<Contrato>(`/contrato/${id}`);
}

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

export function excluirContrato(id: number) {
  return api<void>(`/contrato/${id}`, {
    method: "DELETE",
  });
}
