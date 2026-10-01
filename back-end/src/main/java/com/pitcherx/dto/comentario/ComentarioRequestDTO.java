package com.pitcherx.dto.comentario;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ComentarioRequestDTO(
		@NotBlank(message = "O comentário é obrigatório!") String textoComentario,
		@NotNull(message = "O ID da postagem é obrigatório!") Long postagemId,
		@NotNull(message = "O ID do usuário é obrigatório!") Long usuarioId
		) {

}
