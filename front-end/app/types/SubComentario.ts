export interface SubComentarioRequest {
  textoSubComentario: string;
  comentarioId: number;
  usuarioId: number;
}

/**
 * SubComentarioResponseDTO. `usuarioId` chega nulo: o mapper do backend não o preenche
 * (ver lib/autoriaRespostas). `like/dislike` são colunas removidas (V17) — sempre nulas.
 */
export interface SubComentario {
  idSubComentario: number;
  textoSubComentario: string;
  likeSubComentario?: number | null;
  dislikeSubComentario?: number | null;
  comentarioId: number;
  usuarioId: number | null;
}
