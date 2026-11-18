package com.pitcherx.dto.mensagem;

/**
 * Se o usuário logado pode conversar com outra pessoa.
 *
 * @param conversaId conversa já existente entre os dois (null se ainda não houve mensagens)
 */
public record PermissaoMensagemDTO(
        ParticipanteConversaDTO usuario,
        boolean podeEnviar,
        String situacao,
        String motivo,
        Long conversaId
) {
}
