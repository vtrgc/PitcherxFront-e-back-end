import { api } from "../lib/api";
import { Comentario } from "../types/Comentario";
import { ComentarioRequest } from "../types/ComentarioRequest";

export function listarComentarios() {
  return api<Comentario[]>("/comentario");
}

export function buscarComentario(id: number) {
  return api<Comentario>(`/comentario/${id}`);
}

export function criarComentario(data: ComentarioRequest) {
  return api<Comentario>("/comentario", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function atualizarComentario(id: number, data: ComentarioRequest) {
  return api<Comentario>(`/comentario/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function excluirComentario(id: number) {
  return api<void>(`/comentario/${id}`, {
    method: "DELETE",
  });
}
