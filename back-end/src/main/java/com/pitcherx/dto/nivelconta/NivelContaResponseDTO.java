package com.pitcherx.dto.nivelconta;

import io.swagger.v3.oas.annotations.media.Schema;

public record NivelContaResponseDTO(
        @Schema(description = "ID do nível de conta", example = "1")
        Long idNivelConta,

        @Schema(description = "Nome do nível", example = "INICIANTE",
                allowableValues = {"INICIANTE", "EXPLORADOR", "PROFISSIONAL", "ESPECIALISTA", "REFERENCIA", "ELITE"})
        String nome,

        @Schema(description = "Descrição do nível", example = "Usuário recém-cadastrado")
        String descricao,

        @Schema(description = "Ordem do nível", example = "1")
        Integer ordem
) {}
