package com.pitcherx.mapper;

import com.pitcherx.dto.tipoProjeto.TipoProjetoRequestDTO;
import com.pitcherx.dto.tipoProjeto.TipoProjetoResponseDTO;
import com.pitcherx.model.TipoProjeto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface TipoProjetoMapper {

    TipoProjetoResponseDTO toDTO(TipoProjeto tipoProjeto);

    @Mapping(target = "idTipoProjeto", ignore = true)
    TipoProjeto toEntity(TipoProjetoRequestDTO tipoProjetoRequestDTO);

    void updateFromDTO(TipoProjetoRequestDTO tipoProjetoRequestDTO, @MappingTarget TipoProjeto tipoProjeto);

}
