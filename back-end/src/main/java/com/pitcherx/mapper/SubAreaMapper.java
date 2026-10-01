package com.pitcherx.mapper;

import com.pitcherx.dto.subArea.SubAreaRequestDTO;
import com.pitcherx.dto.subArea.SubAreaResponseDTO;
import com.pitcherx.model.SubArea;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface SubAreaMapper {

    SubAreaResponseDTO toDTO(SubArea subArea);

    @Mapping(target = "idSubArea", ignore = true)
    SubArea toEntity(SubAreaRequestDTO subAreaRequestDTO);

    void updateEntityFromDTO(SubAreaRequestDTO subAreaRequestDTO, @MappingTarget SubArea subArea);
}
