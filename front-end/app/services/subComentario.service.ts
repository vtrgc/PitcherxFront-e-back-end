import { api } from "../lib/api";
import { SubComentario, SubComentarioRequest } from "../types/SubComentario";

export function listarSubComentarios() {
  return api<SubComentario[]>("/sub-comentario");
}

export function buscarSubComentario(id: number) {
  return api<SubComentario>(`/sub-comentario/${id}`);
}

export function criarSubComentario(data: SubComentarioRequest) {
  return api<SubComentario>("/sub-comentario", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function atualizarSubComentario(id: number, data: SubComentarioRequest) {
  return api<SubComentario>(`/sub-comentario/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function excluirSubComentario(id: number) {
  return api<void>(`/sub-comentario/${id}`, {
    method: "DELETE",
  });
}
