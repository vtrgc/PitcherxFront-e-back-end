package com.pitcherx.dto.mensagem;

import java.time.Instant;
import java.util.List;

/**
 * Trecho do histórico, em ordem de envio.
 *
 * @param temMais existem mensagens mais antigas (ou, na atualização incremental, mais alterações
 *                do que cabem numa resposta: recarregue a conversa)
 * @param cursor  valor para o parâmetro {@code desde} da próxima atualização incremental
 */
public record HistoricoMensagensDTO(
        List<MensagemResponseDTO> mensagens,
        boolean temMais,
        Instant cursor
) {
}
