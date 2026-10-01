package com.pitcherx.dto.projeto;

import java.time.LocalDate;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;

public record ProjetoResponseDTO(
		Long idProjeto,
		String nomeProjeto,
		String descricaoProjeto,
		
		@JsonFormat(pattern = "dd/MM/yyyy")
		LocalDate dataInicioProjeto,
		
		@JsonFormat(pattern = "dd/MM/yyyy")
		LocalDate dataFimProjeto,
		Long tipoProjetoId,
		Boolean active,
		String urlImagemProjeto,
		List<String> imagens
		) {

}
