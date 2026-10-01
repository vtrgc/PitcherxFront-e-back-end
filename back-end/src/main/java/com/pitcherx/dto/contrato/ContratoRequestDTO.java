package com.pitcherx.dto.contrato;

import java.time.LocalDateTime;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ContratoRequestDTO(
        @NotBlank(message = "O título do contrato é obrigatório!") String tituloContrato,
        @NotBlank(message = "A descrição do contrato é obrigatória!") String descricaoContrato,
        @NotNull(message = "A data de início é obrigatória!") LocalDateTime dataInicioContrato,
        @NotNull(message = "A data de fim é obrigatória!") LocalDateTime dataFimContrato,
        @NotNull(message = "O id do projeto é obrigatório!") Long projetoId
) {

}
