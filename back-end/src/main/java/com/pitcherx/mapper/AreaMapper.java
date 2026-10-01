package com.pitcherx.mapper;

import com.pitcherx.dto.area.AreaRequestDTO;
import com.pitcherx.dto.area.AreaResponseDTO;
import com.pitcherx.model.Area;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface AreaMapper {

    AreaResponseDTO toDTO(Area area);

    @Mapping(target = "idArea", ignore = true)
    Area toEntity(AreaRequestDTO areaRequestDTO);

    void updateFromDTO(AreaRequestDTO areaRequestDTO, @MappingTarget Area area);

}
