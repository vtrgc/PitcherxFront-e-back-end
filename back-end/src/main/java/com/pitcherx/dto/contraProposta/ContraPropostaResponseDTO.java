package com.pitcherx.dto.contraProposta;


public record ContraPropostaResponseDTO(
		Long idContraProposta,
		String descricaoContraProposta,
		Double valorContraProposta,
		Long propostaId
		) {

}
