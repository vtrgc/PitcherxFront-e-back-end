package com.pitcherx.dto.postagem;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonFormat;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PostagemRequestDTO(
		@NotBlank(message = "O titulo da postagem é obrigatório!") String tituloPostagem,
		@NotBlank(message = "O texto da postagem é obrigatório!") String textoPostagem,
		
		@NotNull(message = "A data de início é obrigatória!")
		@FutureOrPresent(message = "A data de início não pode ser retroativa!")
		@JsonFormat(pattern = "dd/MM/yyyy")
		@Schema(type = "string", pattern = "dd/MM/yyyy", example = "dd/MM/yyyy")
		LocalDate dataPostagem,
		String urlImagemPostagem,
		@NotNull(message = "É obrigatório informar o ID do usuário a quem a postagem pertence!")
		Long usuarioId
		) {

}
