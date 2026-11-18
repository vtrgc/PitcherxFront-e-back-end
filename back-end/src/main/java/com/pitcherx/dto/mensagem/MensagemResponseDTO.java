package com.pitcherx.dto.mensagem;

import java.time.Instant;

/**
 * @param conteudo null quando a mensagem foi excluída
 * @param minha    true quando quem consulta é o remetente
 */
public record MensagemResponseDTO(
        Long idMensagem,
        Long conversaId,
        Long remetenteId,
        String conteudo,
        Instant dataEnvio,
        boolean lida,
        Instant dataLeitura,
        Instant dataEdicao,
        boolean excluida,
        boolean minha
) {
}
