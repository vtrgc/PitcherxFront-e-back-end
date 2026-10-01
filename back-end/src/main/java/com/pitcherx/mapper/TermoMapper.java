package com.pitcherx.mapper;

import com.pitcherx.dto.termo.TermoRequestDTO;
import com.pitcherx.dto.termo.TermoResponseDTO;
import com.pitcherx.model.Termo;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface TermoMapper {

    @Mapping(source = "contrato.idContrato", target = "contratoId")
    TermoResponseDTO toDTO(Termo termo);

    @Mapping(target = "idTermo", ignore = true)
    Termo toEntity(TermoRequestDTO termoRequestDTO);

    void toUpdate(TermoRequestDTO termoRequestDTO, @MappingTarget Termo termo);

}
