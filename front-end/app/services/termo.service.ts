import { api } from "../lib/api";
import { Termo, TermoRequest } from "../types/Termo";

export function listarTermos() {
  return api<Termo[]>("/termo");
}

export function buscarTermo(id: number) {
  return api<Termo>(`/termo/${id}`);
}

export function criarTermo(data: TermoRequest) {
  return api<Termo>("/termo", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function atualizarTermo(id: number, data: TermoRequest) {
  return api<Termo>(`/termo/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function excluirTermo(id: number) {
  return api<void>(`/termo/${id}`, {
    method: "DELETE",
  });
}
