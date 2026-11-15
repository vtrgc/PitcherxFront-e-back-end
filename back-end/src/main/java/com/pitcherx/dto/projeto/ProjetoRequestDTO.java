package com.pitcherx.dto.projeto;

import java.time.LocalDate;
import java.util.List;

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
		
		@NotNull(message = "A meta financeira é obrigatória!") Double metaFinanceira,
		
		Double valorArrecadado,
		
		@NotNull(message = "O investimento mínimo é obrigatório!") Double investimentoMinimo,
		
		@NotNull(message = "A participação oferecida é obrigatória!") Integer participacaoOferecida,
		
		String usoRecursos,
		
		String urlImagemProjeto,
		String urlVideoProjeto,
		List<String> imagens,
		List<String> videos,
		
		@NotNull(message = "A lista de riscos do projeto é obrigatória!") List<@NotNull Long> riscoProjetoIds
		) {

}
