package com.pitcherx.dto.contraProposta;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ContraPropostaDecisionDTO(
        @NotNull(message = "O status da decisão é obrigatório!")
        @Schema(description = "Decisão sobre a contraproposta", example = "ACEITA", allowableValues = {"ACEITA", "REJEITADA"})
        String status,

        @Schema(description = "Justificativa (obrigatória se rejeitar)", example = "Valor não aceitável")
        String justificativa
) {

}
