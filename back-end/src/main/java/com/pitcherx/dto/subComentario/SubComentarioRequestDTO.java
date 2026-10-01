package com.pitcherx.dto.subComentario;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SubComentarioRequestDTO(
		@NotBlank(message = "O sub-comentário é obrigatório!") String textoSubComentario,
		@NotNull(message = "O ID do comentário é obrigatório!") Long comentarioId,
		@NotNull(message = "O ID do usuário é obrigatório!") Long usuarioId
		) {

}
