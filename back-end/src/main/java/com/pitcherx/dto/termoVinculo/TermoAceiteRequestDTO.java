package com.pitcherx.dto.termoVinculo;

import jakarta.validation.constraints.NotNull;

public record TermoAceiteRequestDTO(
        @NotNull(message = "O ID do termo é obrigatório.") Long termoId
) {
}