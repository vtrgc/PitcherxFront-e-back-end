package com.pitcherx.dto.usuario.esqueciSenha;

import jakarta.validation.constraints.NotBlank;

public record ValidarTokenRequestDTO(
        @NotBlank(message = "O email do usuário é obrigatório") String emailUsuario,
        @NotBlank(message = "O código de redefinição é obrigatório") String codigoRedefinicao
) {
}
