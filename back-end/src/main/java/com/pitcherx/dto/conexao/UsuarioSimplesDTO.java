package com.pitcherx.dto.conexao;

public record UsuarioSimplesDTO(
        Long idUsuario,
        String nomeUsuario,
        String urlImagemUsuario,
        String identificador
) {
}