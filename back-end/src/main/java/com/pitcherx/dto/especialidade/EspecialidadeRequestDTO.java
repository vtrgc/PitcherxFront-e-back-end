package com.pitcherx.dto.especialidade;

import jakarta.validation.constraints.NotBlank;

public record EspecialidadeRequestDTO(
        @NotBlank(message = "O nome da especialidade é obrigatório!") String nomeEspecialidade
) {
}
