package com.pitcherx.dto.mensagem;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MensagemEdicaoRequestDTO(
        @NotBlank(message = "A mensagem não pode ficar vazia.")
        @Size(max = 2000, message = "A mensagem pode ter no máximo 2000 caracteres.")
        String conteudo
) {
}
