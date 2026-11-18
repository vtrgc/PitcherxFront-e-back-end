package com.pitcherx.dto.mensagem;

/** Dados públicos da outra pessoa da conversa (sem e-mail, telefone ou documento). */
public record ParticipanteConversaDTO(
        Long idUsuario,
        String nomeUsuario,
        String urlImagemUsuario
) {
}
