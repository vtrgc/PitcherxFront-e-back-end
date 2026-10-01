package com.pitcherx.dto.termo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record TermoRequestDTO(
    @NotBlank(message = "O título do termo é obrigatório") String tituloTermo,
    @NotBlank(message = "A descrição do termo é obrigatória") String descricaoTermo,
    @NotNull(message = "O ID do contrato é obrigatório!") Long contratoId
){
}
