package com.pitcherx.dto.area;

import jakarta.validation.constraints.NotBlank;

public record AreaRequestDTO(
        @NotBlank(message = "O nome da área é obrigatório!") String nomeArea,
        @NotBlank(message = "A descrição da área é obrigatório!") String descricaoArea
) {
}
