package com.pitcherx.dto.tipoProjeto;

import jakarta.validation.constraints.NotBlank;

public record TipoProjetoRequestDTO(
        @NotBlank(message = "O nome do projeto é obrigatório") String nomeTipoProjeto,
        @NotBlank(message = "A descrição do projeto é obrigatória") String descricaoTipoProjeto
) {
}
