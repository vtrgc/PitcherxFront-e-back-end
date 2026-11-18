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

/**
 * Exclui um comentário. As respostas saem junto: as tabelas criadas pelas migrations têm
 * ON DELETE CASCADE. Antes, o front apagava as respostas uma a uma; como só o autor (ou o
 * admin) pode apagar uma resposta, um comentário com resposta de outra pessoa não podia ser
 * excluído (403 no meio do caminho).
 */
export async function excluirComentarioComRespostas(idComentario: number) {
  await excluirComentario(idComentario);
}
