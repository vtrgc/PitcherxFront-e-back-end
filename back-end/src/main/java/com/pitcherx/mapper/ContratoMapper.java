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
    @Mapping(source = "proposta.idProposta", target = "propostaId")
    ContratoResponseDTO toDTO(Contrato contrato);

    @Mapping(target = "idContrato", ignore = true)
    @Mapping(target = "projeto", ignore = true)
    @Mapping(target = "proposta", ignore = true)
    Contrato toEntity(ContratoRequestDTO contratoRequestDTO);

    @Mapping(target = "idContrato", ignore = true)
    @Mapping(target = "projeto", ignore = true)
    @Mapping(target = "proposta", ignore = true)
    @Mapping(target = "statusContrato", ignore = true)
    @Mapping(target = "active", ignore = true)
    void toUpdate(ContratoRequestDTO contratoRequestDTO, @MappingTarget Contrato contrato);

}
