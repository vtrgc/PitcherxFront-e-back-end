package com.pitcherx.dto.usuario;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UsuarioUpdateDTO(
        @NotBlank(message = "O nome do usuário é obrigatório!") String nomeUsuario,
        @Email(message = "Email inválido!") @NotBlank(message = "O email do usuário é obrigatório!") String emailUsuario,
        String telefoneUsuario,
        String urlImagemUsuario
) {
}