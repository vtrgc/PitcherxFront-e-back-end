package com.pitcherx.dto.denuncia;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DenunciaApelacaoDTO(
        @NotBlank(message = "A justificativa da apelação é obrigatória!")
        @Size(max = 1000)
        @Schema(description = "Justificativa da apelação", example = "O conteúdo foi mal interpretado, não viola nenhuma regra")
        String justificativa
) {}
