import { api, mapComLimite } from "../lib/api";
import { Post } from "../types/Post";
import { PostagemRequest } from "../types/PostagemRequest";
import { buscarStatusCurtida, TIPO_CONTEUDO } from "./curtida.service";
import { listarComentarios } from "./comentario.service";

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

/**
 * Anexa a quantidade de comentários de cada postagem. A API não tem contagem por postagem,
 * só a listagem geral `GET /comentario` (uma única chamada para todas as postagens).
 * Se a listagem falhar, os posts seguem sem contagem (o card mostra quando abrir).
 */
async function comComentarios(posts: Post[]): Promise<Post[]> {
  if (posts.length === 0) return posts;
  let comentarios;
  try {
    comentarios = (await listarComentarios()) ?? [];
  } catch {
    return posts;
  }
  const porPostagem = new Map<number, number>();
  for (const c of comentarios) porPostagem.set(c.postagemId, (porPostagem.get(c.postagemId) ?? 0) + 1);
  return posts.map((post) => ({ ...post, totalComentarios: porPostagem.get(post.idPostagem) ?? 0 }));
}

/** Curtidas (total e se eu curti) e quantidade de comentários de uma lista de postagens. */
export async function detalharPostagens(posts: Post[], usuarioId: number | null): Promise<Post[]> {
  const [comContagem, comStatus] = await Promise.all([comComentarios(posts), comCurtidas(posts, usuarioId)]);
  return comStatus.map((post, i) => ({ ...post, totalComentarios: comContagem[i].totalComentarios }));
}

/** Lista as postagens (mais recentes primeiro) com curtidas e comentários já contados. */
export async function listarPostagensComCurtidas(usuarioId: number | null) {
  const posts = await listarPostagens();
  const ordenados = [...(posts ?? [])].sort((a, b) => b.idPostagem - a.idPostagem);
  return detalharPostagens(ordenados, usuarioId);
}

export function buscarPostagem(id: number) {
  return api<Post>(`/postagem/${id}`);
}

export async function buscarPostagemComCurtidas(id: number, usuarioId: number | null) {
  const post = await buscarPostagem(id);
  const [resultado] = await detalharPostagens([post], usuarioId);
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
