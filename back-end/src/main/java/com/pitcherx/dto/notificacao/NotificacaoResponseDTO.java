package com.pitcherx.dto.notificacao;

import java.time.LocalDateTime;

public record NotificacaoResponseDTO(
        Long idNotificacao,
        String titulo,
        String mensagem,
        String tipo,
        Long referenciaId,
        Boolean lida,
        LocalDateTime dataCriacao
) {
}