import { api } from "../lib/api";
import { TermoPostagem, TermoPostagemRequest } from "../types/TermoPostagem";

export function listarTermosPostagem() {
  return api<TermoPostagem[]>("/termo-postagem");
}

export function buscarTermoPostagem(id: number) {
  return api<TermoPostagem>(`/termo-postagem/${id}`);
}

export function criarTermoPostagem(data: TermoPostagemRequest) {
  return api<TermoPostagem>("/termo-postagem", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function atualizarTermoPostagem(id: number, data: TermoPostagemRequest) {
  return api<TermoPostagem>(`/termo-postagem/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function excluirTermoPostagem(id: number) {
  return api<void>(`/termo-postagem/${id}`, {
    method: "DELETE",
  });
}
