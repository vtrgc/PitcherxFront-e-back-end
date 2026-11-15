package com.pitcherx.dto.usuario;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

public record NivelContaAlteracaoDTO(
        @NotNull(message = "O ID do nível de conta é obrigatório!")
        @Schema(description = "ID do nível de conta desejado", example = "3")
        Long nivelId
) {}
