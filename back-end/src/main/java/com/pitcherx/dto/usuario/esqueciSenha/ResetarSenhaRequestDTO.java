package com.pitcherx.dto.usuario.esqueciSenha;

import jakarta.validation.constraints.NotBlank;

public record ResetarSenhaRequestDTO(
        @NotBlank(message = "O email do usuário é obrigatório") String emailUsuario,
        @NotBlank(message = "O código de redefinição é obrigatório") String codigoRedefinicao,
        @NotBlank(message = "A nova senha é obrigatória") String novaSenha
) {
}
