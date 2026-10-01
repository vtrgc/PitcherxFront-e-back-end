package com.pitcherx.dto.usuario;

import jakarta.validation.constraints.NotBlank;

public record UsuarioRequestDTO(
        @NotBlank(message = "O nome do usuário é obrigatório!") String nomeUsuario,
        @NotBlank(message = "O email do usuário é obrigatório!") String emailUsuario,
        @NotBlank(message = "A senha do usuário é obrigatória!") String senhaUsuario,
        String telefoneUsuario
) {
}
