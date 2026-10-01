package com.pitcherx.dto.subArea;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SubAreaRequestDTO(
        @NotBlank(message = "O nome da subárea é obrigatório") String nomeSubArea,
        @NotBlank(message = "A descrição da subárea é obrigatória") String descricaoSubArea,
        @NotNull(message = "É obrigatório informal a área da sub-área pelo ID") Long idArea
) {
}
