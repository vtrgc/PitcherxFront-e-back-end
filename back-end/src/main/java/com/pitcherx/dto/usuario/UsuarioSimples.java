package com.pitcherx.dto.usuario;

public record UsuarioSimples(
        Long idUsuario,
        String nomeUsuario,
        String emailUsuario,
        Boolean active
) {
}
