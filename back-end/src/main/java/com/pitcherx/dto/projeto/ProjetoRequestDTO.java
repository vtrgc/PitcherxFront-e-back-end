package com.pitcherx.dto.projeto;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonFormat;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ProjetoRequestDTO(
		@NotBlank(message = "O nome do projeto é obrigatório!") String nomeProjeto,
		@NotBlank(message = "A descrição do projeto é obrigatória!") String descricaoProjeto,
		
		@NotNull(message = "A data de início é obrigatória!")
		@FutureOrPresent(message = "A data de início não pode ser retroativa!")
		@JsonFormat(pattern = "dd/MM/yyyy")
		@Schema(type = "string", pattern = "dd/MM/yyyy", example = "dd/MM/yyyy") 
		LocalDate dataInicioProjeto,
		
		@NotNull(message = "A data de término é obrigatória!")
		@Future(message = "A data de término deve ser uma data futura!")
		@JsonFormat(pattern = "dd/MM/yyyy")
		@Schema(type = "string", pattern = "dd/MM/yyyy", example = "dd/MM/yyyy") 
		LocalDate dataFimProjeto,
		
		@NotNull(message = "O tipo de projeto é obrigatório!") Long tipoProjetoId,
		String urlImagemProjeto
		) {

}
