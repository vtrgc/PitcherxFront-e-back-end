package com.pitcherx.mapper;

import com.pitcherx.dto.riscoProjeto.RiscoProjetoRequestDTO;
import com.pitcherx.dto.riscoProjeto.RiscoProjetoResponseDTO;
import com.pitcherx.model.RiscoProjeto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface RiscoProjetoMapper {

    RiscoProjetoResponseDTO toDTO(RiscoProjeto riscoProjeto);

    @Mapping(target = "idRiscoProjeto", ignore = true)
    @Mapping(target = "projetos", ignore = true)
    RiscoProjeto toEntity(RiscoProjetoRequestDTO requestDTO);

    @Mapping(target = "idRiscoProjeto", ignore = true)
    @Mapping(target = "projetos", ignore = true)
    void updateFromDTO(RiscoProjetoRequestDTO requestDTO, @MappingTarget RiscoProjeto riscoProjeto);
}
