package com.pitcherx.dto.subArea;

import com.pitcherx.model.Area;

public record SubAreaResponseDTO(
        Long idSubArea,
        String nomeSubArea,
        String descricaoSubArea,
        Area area
) {
}
