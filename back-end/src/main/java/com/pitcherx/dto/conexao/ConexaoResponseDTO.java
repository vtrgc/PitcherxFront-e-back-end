package com.pitcherx.dto.conexao;

import com.pitcherx.model.StatusConexao;

import java.time.LocalDateTime;

public record ConexaoResponseDTO(
        Long idConexao,
        UsuarioSimplesDTO seguidor,
        UsuarioSimplesDTO seguido,
        StatusConexao status,
        LocalDateTime dataSolicitacao,
        LocalDateTime dataResposta
) {
}