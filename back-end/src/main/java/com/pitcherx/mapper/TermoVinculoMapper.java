package com.pitcherx.mapper;

import com.pitcherx.dto.termoVinculo.TermoVinculoRequestDTO;
import com.pitcherx.dto.termoVinculo.TermoVinculoResponseDTO;
import com.pitcherx.model.TermoVinculo;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface TermoVinculoMapper {

    TermoVinculoResponseDTO toDTO(TermoVinculo termoVinculo);

    @Mapping(target = "idTermoVinculo", ignore = true)
    TermoVinculo toEntity(TermoVinculoRequestDTO termoVinculoRequestDTO);

    void updateFromDTO(TermoVinculoRequestDTO termoVinculoRequestDTO, @MappingTarget TermoVinculo termoVinculo);

}
