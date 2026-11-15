package com.pitcherx.dto.solicitacaoVinculo;

import java.time.LocalDateTime;

public record SolicitacaoVinculoResponseDTO(
        Long idSolicitacaoVinculo,
        Long projetoId,
        String nomeProjeto,
        Long solicitanteId,
        String nomeSolicitante,
        String emailSolicitante,
        Long tipoVinculoDesejadoId,
        String nomeTipoVinculoDesejado,
        String status,
        LocalDateTime dataSolicitacao,
        LocalDateTime dataResposta
) {
}