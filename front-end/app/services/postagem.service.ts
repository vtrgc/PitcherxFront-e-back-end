import { api, mapComLimite } from "../lib/api";
import { Post } from "../types/Post";
import { PostagemRequest } from "../types/PostagemRequest";
import { buscarStatusCurtida, TIPO_CONTEUDO } from "./curtida.service";

export function listarPostagens() {
  return api<Post[]>("/postagem");
}

/** Anexa total de curtidas e se o usuário logado curtiu (uma chamada de status por post). */
async function comCurtidas(posts: Post[], usuarioId: number | null): Promise<Post[]> {
  if (!usuarioId || posts.length === 0) return posts;
  const status = await mapComLimite(posts, 6, (post) =>
    buscarStatusCurtida(usuarioId, TIPO_CONTEUDO.POSTAGEM, post.idPostagem)
  );
  return posts.map((post, i) => {
    const r = status[i];
    return r.status === "fulfilled"
      ? { ...post, totalCurtidas: r.value.quantidadeCurtidas, usuarioCurtiu: r.value.jaCurtiu }
      : post;
  });
}

/** Lista as postagens (mais recentes primeiro) com as curtidas já resolvidas. */
export async function listarPostagensComCurtidas(usuarioId: number | null) {
  const posts = await listarPostagens();
  const ordenados = [...(posts ?? [])].sort((a, b) => b.idPostagem - a.idPostagem);
  return comCurtidas(ordenados, usuarioId);
}

export function buscarPostagem(id: number) {
  return api<Post>(`/postagem/${id}`);
}

export async function buscarPostagemComCurtidas(id: number, usuarioId: number | null) {
  const post = await buscarPostagem(id);
  const [resultado] = await comCurtidas([post], usuarioId);
  return resultado;
}

export function criarPostagem(data: PostagemRequest) {
  return api<Post>("/postagem", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function atualizarPostagem(id: number, data: PostagemRequest) {
  return api<Post>(`/postagem/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function excluirPostagem(id: number) {
  return api<void>(`/postagem/${id}`, {
    method: "DELETE",
  });
}

/**
 * PUT /postagem/{id}/imagens (multipart, campo "arquivos", 1 a 10 imagens) — substitui a
 * galeria inteira. Somente o autor ou ADMIN.
 */
export function substituirImagensPostagem(id: number, arquivos: File[]) {
  const formData = new FormData();
  arquivos.forEach((arquivo) => formData.append("arquivos", arquivo));
  return api<Post>(`/postagem/${id}/imagens`, { method: "PUT", body: formData, timeoutMs: 120000 });
}

/** DELETE /postagem/{id}/imagens — remove todas as imagens. */
export function removerImagensPostagem(id: number) {
  return api<void>(`/postagem/${id}/imagens`, { method: "DELETE" });
}
