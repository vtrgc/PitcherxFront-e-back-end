import { api } from "../lib/api";
import { RiscoProjeto, RiscoProjetoRequest } from "../types/RiscoProjeto";

export function listarRiscosProjeto() {
  return api<RiscoProjeto[]>("/risco-projeto");
}

export function criarRiscoProjeto(data: RiscoProjetoRequest) {
  return api<RiscoProjeto>("/risco-projeto", { method: "POST", body: JSON.stringify(data) });
}

export function atualizarRiscoProjeto(id: number, data: RiscoProjetoRequest) {
  return api<RiscoProjeto>(`/risco-projeto/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function excluirRiscoProjeto(id: number) {
  return api<void>(`/risco-projeto/${id}`, { method: "DELETE" });
}
