package com.pitcherx.dto.mensagem;

import java.time.Instant;

/**
 * Uma conversa do ponto de vista de quem consulta.
 *
 * @param participante  a outra pessoa
 * @param ultimaMensagem prévia da conversa
 * @param naoLidas      mensagens recebidas ainda não lidas
 * @param podeEnviar    existe conexão aceita agora (o histórico continua visível mesmo sem ela)
 * @param situacao      {@link SituacaoConexaoMensagem}
 * @param motivoBloqueio explicação quando não é possível enviar
 */
public record ConversaResponseDTO(
        Long idConversa,
        ParticipanteConversaDTO participante,
        MensagemResponseDTO ultimaMensagem,
        long naoLidas,
        boolean podeEnviar,
        String situacao,
        String motivoBloqueio,
        Instant dataUltimaMensagem
) {
}
