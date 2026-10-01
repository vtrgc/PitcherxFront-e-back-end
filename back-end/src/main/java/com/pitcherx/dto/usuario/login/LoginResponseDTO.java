package com.pitcherx.dto.usuario.login;

import com.pitcherx.model.Role;

import java.util.Set;

public record LoginResponseDTO(
        Long idUsuario,
        String nomeUsuario,
        String emailUsuario,
        boolean isActive,
        String token,
        Set<Role> roles
) {
}
