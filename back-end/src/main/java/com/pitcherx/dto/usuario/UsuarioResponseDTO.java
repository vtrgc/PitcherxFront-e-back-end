package com.pitcherx.dto.usuario;

import com.pitcherx.model.Role;

import java.util.List;

public record UsuarioResponseDTO(
        Long idUsuario,
        String nomeUsuario,
        String emailUsuario,
        String telefoneUsuario,
        String urlImagemUsuario,
        Boolean active,
        List<String> roles
) {
}
