package com.pitcherx.dto.usuario;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

public record AnaliseIdentidadeDTO(
        @NotBlank(message = "O status da análise é obrigatório!")
        @Schema(description = "Resultado da análise de identidade", example = "APROVADA",
                allowableValues = {"APROVADA", "REPROVADA"})
        String status,

        @Schema(description = "Justificativa (obrigatória se reprovada)", example = "Documento ilegível")
        String justificativa
) {}
