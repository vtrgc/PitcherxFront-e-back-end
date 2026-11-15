package com.pitcherx.dto.denuncia;

import com.pitcherx.model.Denuncia;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record DenunciaAdminDecisionDTO(
        @NotNull(message = "O status da decisão é obrigatório!")
        @Schema(description = "Novo status da denúncia", example = "ACEITA", allowableValues = {"ACEITA", "REJEITADA"})
        Denuncia.StatusDenuncia status,

        @NotBlank(message = "A justificativa da decisão é obrigatória!")
        @Size(max = 1000)
        @Schema(description = "Justificativa do admin", example = "Conteúdo violava termos de uso")
        String decisaoAdmin,

        @Size(max = 100)
        @Schema(description = "Ação tomada sobre o conteúdo (REMOVIDO, OCULTO, MANTIDO, SENSIVEL, BANIMENTO_TEMPORARIO, BANIMENTO_PERMANENTE, NENHUMA)",
                example = "REMOVIDO", allowableValues = {"REMOVIDO", "OCULTO", "MANTIDO", "SENSIVEL",
                        "BANIMENTO_TEMPORARIO", "BANIMENTO_PERMANENTE", "NENHUMA"})
        String acaoTomada
) {}
