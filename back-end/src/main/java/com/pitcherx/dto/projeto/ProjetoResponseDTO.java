package com.pitcherx.dto.projeto;

import java.time.LocalDate;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.pitcherx.dto.riscoProjeto.RiscoProjetoResponseDTO;

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
		String urlVideoProjeto,
		List<String> imagens,
		List<String> videos,
		Double metaFinanceira,
		Double valorArrecadado,
		Double investimentoMinimo,
		Integer participacaoOferecida,
		String usoRecursos,
		List<RiscoProjetoResponseDTO> riscos
		) {

}
