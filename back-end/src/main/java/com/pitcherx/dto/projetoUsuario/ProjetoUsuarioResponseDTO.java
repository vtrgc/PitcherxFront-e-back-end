package com.pitcherx.dto.projetoUsuario;

import java.time.LocalDateTime;

public record ProjetoUsuarioResponseDTO(
        Long idProjetoUsuario,
        Long projetoId,
        Long usuarioId,
        String nomeUsuario,
        Long tipoVinculoId,
        String nomeTipoVinculo,
        LocalDateTime dataVinculo
) {
}
