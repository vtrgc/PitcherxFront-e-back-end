import { api } from "../lib/api";
import { TermoVinculo, TermoVinculoRequest } from "../types/TermoVinculo";

export function listarTermosVinculo() {
  return api<TermoVinculo[]>("/termo-vinculo");
}

export function buscarTermoVinculo(id: number) {
  return api<TermoVinculo>(`/termo-vinculo/${id}`);
}

export function criarTermoVinculo(data: TermoVinculoRequest) {
  return api<TermoVinculo>("/termo-vinculo", {
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
