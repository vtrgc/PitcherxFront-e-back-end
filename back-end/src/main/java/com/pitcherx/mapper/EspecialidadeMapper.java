package com.pitcherx.mapper;

import com.pitcherx.dto.especialidade.EspecialidadeRequestDTO;

import com.pitcherx.dto.especialidade.EspecialidadeResponseDTO;
import com.pitcherx.model.Especialidade;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface EspecialidadeMapper {

    EspecialidadeResponseDTO toDTO(Especialidade especialidade);

    @Mapping(target = "idEspecialidade", ignore = true)
    Especialidade toEntity(EspecialidadeRequestDTO especialidadeRequestDTO);

    void updateFromDTO(EspecialidadeRequestDTO especialidadeRequestDTO, @MappingTarget Especialidade especialidade);

}
