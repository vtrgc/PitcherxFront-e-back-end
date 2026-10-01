package com.pitcherx.dto.usuario;

import jakarta.validation.constraints.NotBlank;

public record RedefinirSenhaRequestDTO(
        @NotBlank(message = "A senha atual é obrigatória para a troca de senha!") String senhaAtual,
        @NotBlank(message = "A nova senha é obrigatória para a troca de senha!") String novaSenha
) {
}
