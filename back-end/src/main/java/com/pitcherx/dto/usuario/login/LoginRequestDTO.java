package com.pitcherx.dto.usuario.login;

import jakarta.validation.constraints.NotBlank;

public record LoginRequestDTO(
        @NotBlank(message = "O email do usuário é obrigatório") String emailUsuario,
        @NotBlank(message = "A senha do usuário é obrigatória") String senhaUsuario
) {
}
