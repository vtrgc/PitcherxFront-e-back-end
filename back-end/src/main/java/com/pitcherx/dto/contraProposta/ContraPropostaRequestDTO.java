package com.pitcherx.dto.contraProposta;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ContraPropostaRequestDTO(
		@NotBlank(message = "A descrição da contra proposta é obrigatória!") String descricaoContraProposta,
		Double valorContraProposta,
		@NotNull(message = "O ID da proposta é obrigatório!") Long idProposta
		) {

}
