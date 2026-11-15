package com.pitcherx.dto.termoVinculo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record TermoVinculoRequestDTO(
        @NotBlank(message = "O título do termo de vínculo é obrigatório.") String tituloTermoVinculo,
        @NotBlank(message = "A descrição do termo de vínculo é obrigatória.") String descricaoTermoVinculo,
        Boolean obrigatorio

) {
}
