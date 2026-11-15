package com.pitcherx.dto.proposta;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PropostaRequestDTO(
		@NotBlank(message = "A descricão da proposta é obrigatória!") String descricaoProposta,
		Double valorProposta,
		@NotNull(message = "Informe o projeto que recebe a proposta!") Long projetoId
		) {

}
