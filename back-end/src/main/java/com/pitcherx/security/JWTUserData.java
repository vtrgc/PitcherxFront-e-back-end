package com.pitcherx.security;

import com.pitcherx.model.Role;
import lombok.Builder;

import java.util.Set;

@Builder
public record JWTUserData(
    Long idUsuario,
    String emailUsuario,
    Set<Role> roles
) {
}
