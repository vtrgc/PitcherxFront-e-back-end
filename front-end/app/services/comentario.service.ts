import { api } from "../lib/api";
import { Comentario } from "../types/Comentario";
import { ComentarioRequest } from "../types/ComentarioRequest";
import { excluirSubComentario, listarSubComentarios } from "./subComentario.service";

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
 * Exclui o comentário e, antes, as respostas dele. As migrations do backend criam as chaves com
 * ON DELETE CASCADE, mas com o Flyway desligado (configuração atual) o Hibernate cria as tabelas
 * sem cascata e o DELETE de um comentário com respostas falha com erro 500.
 */
export async function excluirComentarioComRespostas(idComentario: number) {
  const respostas = ((await listarSubComentarios()) ?? []).filter((r) => r.comentarioId === idComentario);
  for (const r of respostas) await excluirSubComentario(r.idSubComentario);
  await excluirComentario(idComentario);
}
