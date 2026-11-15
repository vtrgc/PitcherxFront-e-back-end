package com.pitcherx.dto.termoVinculo;

public record TermoVinculoResponseDTO(
        Long idTermoVinculo,
        Long projetoId,
        String tituloTermoVinculo,
        String descricaoTermoVinculo,
        Boolean obrigatorio
) {
}
