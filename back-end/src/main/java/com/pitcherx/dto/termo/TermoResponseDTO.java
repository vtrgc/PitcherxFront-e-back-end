package com.pitcherx.dto.termo;

public record TermoResponseDTO(
        Long idTermo,
        String tituloTermo,
        String descricaoTermo,
        Long contratoId
) {
}
