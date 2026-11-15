package com.pitcherx.dto.denuncia;

import com.pitcherx.model.Denuncia;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

public record DenunciaResponseDTO(
        @Schema(description = "ID da denúncia", example = "1")
        Long idDenuncia,

        @Schema(description = "Tipo do conteúdo denunciado", example = "POSTAGEM")
        Denuncia.TipoDenuncia tipoDenuncia,

        @Schema(description = "ID do alvo denunciado", example = "1")
        Long alvoId,

        @Schema(description = "Categoria da denúncia", example = "SPAM")
        String categoria,

        @Schema(description = "Detalhes adicionais", example = "Conteúdo publica dados pessoais sem consentimento")
        String descricao,

        @Schema(description = "Status da denúncia", example = "PENDENTE")
        Denuncia.StatusDenuncia status,

        @Schema(description = "Prioridade da denúncia", example = "MEDIA")
        Denuncia.PrioridadeDenuncia prioridade,

        @Schema(description = "Data de criação", example = "2024-01-15T10:30:00")
        LocalDateTime dataCriacao,

        @Schema(description = "Data da decisão do admin", example = "2024-01-16T14:00:00")
        LocalDateTime dataDecisao,

        @Schema(description = "Justificativa do admin", example = "Denúncia procedente, conteúdo removido")
        String decisaoAdmin,

        @Schema(description = "Ação tomada sobre o conteúdo", example = "REMOVIDO")
        String acaoTomada,

        @Schema(description = "Se apelação foi solicitada", example = "false")
        Boolean apelacaoSolicitada
) {}
