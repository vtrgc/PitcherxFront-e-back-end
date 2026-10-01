package com.pitcherx.dto.termoPostagem;

import jakarta.validation.constraints.NotBlank;

public record TermoPostagemRequestDTO(
        @NotBlank(message = "O título do termo de postagem é obrigatório!") String tituloTermoPostagem,
        @NotBlank(message = "A descrição do termo de postagem é obrigatório!") String descricaoTermoPostagem
) {
}
