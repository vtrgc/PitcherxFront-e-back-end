package com.pitcherx.dto.conexao;

import jakarta.validation.constraints.NotNull;

public record ConexaoRequestDTO(
        @NotNull
        Long seguidoId
) {
}