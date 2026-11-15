package com.pitcherx.dto.contraProposta;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

public record ContraPropostaResponseDTO(
        Long idContraProposta,
        String descricaoContraProposta,
        Double valorContraProposta,
        Long propostaId,
        Long usuarioId,
        String usuarioNome,
        String status,
        LocalDateTime dataCriacao,
        LocalDateTime dataDecisao,
        String justificativaDecisao
) {

}
