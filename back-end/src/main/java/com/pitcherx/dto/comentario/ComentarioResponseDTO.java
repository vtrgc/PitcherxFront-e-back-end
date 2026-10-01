package com.pitcherx.dto.comentario;

public record ComentarioResponseDTO(
		Long idComentario,
		String textoComentario,
		Integer likeComentario,
		Integer dislikeComentario,
		Long postagemId,
		Long usuarioId
		) {

}
