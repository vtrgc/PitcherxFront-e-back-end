/**
 * ComentarioResponseDTO. `likeComentario`/`dislikeComentario` ainda existem no DTO,
 * mas as colunas foram removidas na migration V17 — chegam sempre nulos. As curtidas
 * reais ficam na tabela `curtida` (ver curtida.service).
 */
export interface Comentario {
  idComentario: number;
  textoComentario: string;
  likeComentario?: number | null;
  dislikeComentario?: number | null;
  postagemId: number;
  usuarioId: number;
}
