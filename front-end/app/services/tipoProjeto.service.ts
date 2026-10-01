import { api } from "../lib/api";
import { TipoProjeto, TipoProjetoRequest } from "../types/TipoProjeto";

export function listarTiposProjeto() {
  return api<TipoProjeto[]>("/tipo-projeto");
}

export function buscarTipoProjeto(id: number) {
  return api<TipoProjeto>(`/tipo-projeto/${id}`);
}

export function criarTipoProjeto(data: TipoProjetoRequest) {
  return api<TipoProjeto>("/tipo-projeto", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function atualizarTipoProjeto(id: number, data: TipoProjetoRequest) {
  return api<TipoProjeto>(`/tipo-projeto/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function excluirTipoProjeto(id: number) {
  return api<void>(`/tipo-projeto/${id}`, {
    method: "DELETE",
  });
}
