package com.pitcherx.dto.projetoUsuario;

import jakarta.validation.constraints.NotNull;

public record ProjetoUsuarioRequestDTO(
        @NotNull(message = "O projeto é obrigatório") Long projetoId,
        @NotNull(message = "O usuário é obrigatório") Long usuarioId,
        @NotNull(message = "O tipo de vínculo é obrigatório") Long tipoVinculoId
) {
}
