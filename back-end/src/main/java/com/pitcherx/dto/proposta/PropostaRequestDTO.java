package com.pitcherx.dto.proposta;

import jakarta.validation.constraints.NotBlank;

public record PropostaRequestDTO(
		@NotBlank(message = "A descricão da proposta é obrigatória!") String descricaoProposta,
		Double valorProposta
		) {

}
