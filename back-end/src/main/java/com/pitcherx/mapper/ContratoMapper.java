package com.pitcherx.mapper;

import com.pitcherx.dto.contrato.ContratoRequestDTO;
import com.pitcherx.dto.contrato.ContratoResponseDTO;
import com.pitcherx.model.Contrato;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ContratoMapper {

    @Mapping(source = "projeto.idProjeto", target = "projetoId")
    ContratoResponseDTO toDTO(Contrato contrato);

    @Mapping(target = "idContrato", ignore = true)
    Contrato toEntity(ContratoRequestDTO contratoRequestDTO);

    void toUpdate(ContratoRequestDTO contratoRequestDTO, @MappingTarget Contrato contrato);
}
