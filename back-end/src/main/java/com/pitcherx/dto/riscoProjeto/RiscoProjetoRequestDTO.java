package com.pitcherx.dto.riscoProjeto;

import jakarta.validation.constraints.NotBlank;

public record RiscoProjetoRequestDTO(
        @NotBlank(message = "O nome do risco é obrigatório!") String nomeRisco,
        String descricaoRisco
) {
}
