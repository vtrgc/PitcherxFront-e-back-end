package com.pitcherx.dto.solicitacaoVinculo;

import jakarta.validation.constraints.NotNull;

public record SolicitacaoVinculoRequestDTO(
        @NotNull(message = "O tipo de vínculo desejado é obrigatório.") Long tipoVinculoDesejadoId
) {
}