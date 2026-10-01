import { api } from "../lib/api";

/**
 * IDs de `tipo_conteudo`. O DataInitializer do backend os cria na ordem do enum
 * TipoConteudoEnum (POSTAGEM, COMENTARIO, SUBCOMENTARIO, PROJETO) em um banco vazio.
 */
export const TIPO_CONTEUDO = {
  POSTAGEM: 1,
  COMENTARIO: 2,
  SUBCOMENTARIO: 3,
  PROJETO: 4,
} as const;

/** Resposta de GET /curtida/status/{usuarioId}/{tipoConteudoId}/{conteudoId}. */
export interface StatusCurtida {
  jaCurtiu: boolean;
  quantidadeCurtidas: number;
}

/** POST /curtida/{usuarioId}/{tipoConteudoId}/{conteudoId} — devolve o id da curtida. */
export function curtirConteudo(usuarioId: number, tipoConteudoId: number, conteudoId: number) {
  return api<number>(`/curtida/${usuarioId}/${tipoConteudoId}/${conteudoId}`, {
    method: "POST",
  });
}

/** DELETE /curtida/{usuarioId}/{tipoConteudoId}/{conteudoId}. */
export function descurtirConteudo(usuarioId: number, tipoConteudoId: number, conteudoId: number) {
  return api<void>(`/curtida/${usuarioId}/${tipoConteudoId}/${conteudoId}`, {
    method: "DELETE",
  });
}

/** GET /curtida/contar-curtidas/{tipoConteudoId}/{conteudoId}. */
export async function buscarContagemCurtidas(tipoConteudoId: number, conteudoId: number) {
  const total = await api<number>(`/curtida/contar-curtidas/${tipoConteudoId}/${conteudoId}`);
  return typeof total === "number" ? total : Number(total) || 0;
}

/**
 * GET /curtida/status/... devolve `{ jaCurtiu, quantidadeCurtidas }` numa única chamada
 * (antes o front tratava a resposta como boolean — qualquer objeto era "curtido").
 */
export async function buscarStatusCurtida(
  usuarioId: number,
  tipoConteudoId: number,
  conteudoId: number
): Promise<StatusCurtida> {
  const status = await api<Partial<StatusCurtida>>(`/curtida/status/${usuarioId}/${tipoConteudoId}/${conteudoId}`);
  return {
    jaCurtiu: !!status?.jaCurtiu,
    quantidadeCurtidas: Number(status?.quantidadeCurtidas) || 0,
  };
}
