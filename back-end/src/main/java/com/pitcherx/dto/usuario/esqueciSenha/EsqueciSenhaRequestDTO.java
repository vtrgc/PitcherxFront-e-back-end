package com.pitcherx.dto.usuario.esqueciSenha;

import jakarta.validation.constraints.NotBlank;

public record EsqueciSenhaRequestDTO(
        @NotBlank(message = "O email é obrigatório para solicitação de redefinição de senha!") String usuarioEmail
) {
}
