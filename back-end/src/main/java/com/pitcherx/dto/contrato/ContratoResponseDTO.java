package com.pitcherx.dto.contrato;

import java.time.LocalDateTime;

public record ContratoResponseDTO(
        Long idContrato,
        String tituloContrato,
        String descricaoContrato,
        LocalDateTime dataInicioContrato,
        LocalDateTime dataFimContrato,
        Boolean active,
        Long projetoId
) {

}
