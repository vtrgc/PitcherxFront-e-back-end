package com.pitcherx.dto.conexao;

import com.pitcherx.model.StatusConexao;

public record StatusConexaoDTO(
        StatusConexao status,
        boolean isSeguidor,
        boolean isSeguido
) {
}