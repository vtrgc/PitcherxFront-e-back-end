package com.pitcherx.dto.subComentario;

public record SubComentarioResponseDTO(
		Long idSubComentario,
		String textoSubComentario,
		Integer likeSubComentario,
		Integer dislikeSubComentario,
		Long comentarioId,
		Long usuarioId
		) {

}
