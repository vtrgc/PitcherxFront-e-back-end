package com.pitcherx.dto.denuncia;

import com.pitcherx.model.Denuncia;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record DenunciaRequestDTO(
        @NotNull(message = "O tipo de denúncia é obrigatório!")
        @Schema(description = "Tipo do conteúdo denunciado", example = "POSTAGEM",
                allowableValues = {"PERFIL", "POSTAGEM", "PROJETO", "COMENTARIO"})
        Denuncia.TipoDenuncia tipoDenuncia,

        @NotNull(message = "O ID do alvo é obrigatório!")
        @Schema(description = "ID do perfil/postagem/projeto/comentário denunciado", example = "1")
        Long alvoId,

        @NotBlank(message = "A categoria da denúncia é obrigatória!")
        @Size(max = 50)
        @Schema(description = "Categoria do motivo (SPAM, NUDEZ, DISCURSO_ODIO, ASSÉDIO, etc.)", example = "SPAM",
                allowableValues = {"SPAM", "NUDEZ", "DISCURSO_ODIO", "ASSÉDIO", "VENDA_ILEGAL", "PROPRIEDADE_INTELECTUAL",
                        "AUTOMUTILACAO", "INFO_FALSA", "CONTEUDO_SENSIVEL", "IDENTIDADE_FALSA", "MENOR_RISCO", "OUTROS"})
        String categoria,

        @Size(max = 1000)
        @Schema(description = "Detalhes adicionais opcionais", example = "Conteúdo publica dados pessoais sem consentimento")
        String descricao
) {}
