package com.pitcherx.dto.mensagem;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Envio de mensagem. O remetente é sempre o usuário do token (nunca vem do corpo).
 *
 * @param chaveCliente identificador do envio gerado pelo front (UUID); reenviar com a mesma chave
 *                     devolve a mensagem já criada em vez de duplicá-la
 */
public record MensagemRequestDTO(
        @NotNull(message = "Informe o destinatário.")
        Long destinatarioId,
        @NotBlank(message = "A mensagem não pode ficar vazia.")
        @Size(max = 2000, message = "A mensagem pode ter no máximo 2000 caracteres.")
        String conteudo,
        @Size(max = 64, message = "Chave de envio inválida.")
        String chaveCliente
) {
}
