package com.pitcherx.dto.denuncia;

import io.swagger.v3.oas.annotations.media.Schema;

public record DenunciaCategoriaDTO(
        @Schema(description = "Código da categoria", example = "SPAM")
        String codigo,

        @Schema(description = "Descrição da categoria", example = "Spam")
        String descricao,

        @Schema(description = "Tipo de denúncia associado", example = "POSTAGEM")
        String tipoDenuncia
) {}
