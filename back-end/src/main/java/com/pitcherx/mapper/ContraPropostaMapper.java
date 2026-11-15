package com.pitcherx.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import com.pitcherx.dto.contraProposta.ContraPropostaRequestDTO;
import com.pitcherx.dto.contraProposta.ContraPropostaResponseDTO;
import com.pitcherx.model.ContraProposta;

@Mapper(componentModel = "spring")
public interface ContraPropostaMapper {

    @Mapping(source = "proposta.idProposta", target = "propostaId")
    @Mapping(source = "usuario.idUsuario", target = "usuarioId")
    @Mapping(source = "usuario.nomeUsuario", target = "usuarioNome")
    @Mapping(source = "status", target = "status")
    ContraPropostaResponseDTO toDTO(ContraProposta contraProposta);

    @Mapping(target = "idContraProposta", ignore = true)
    @Mapping(target = "proposta", ignore = true)
    @Mapping(target = "usuario", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "dataCriacao", ignore = true)
    @Mapping(target = "dataAtualizacao", ignore = true)
    @Mapping(target = "dataDecisao", ignore = true)
    ContraProposta toEntity(ContraPropostaRequestDTO contraPropostaRequestDTO);

    void toUpdate(ContraPropostaRequestDTO contraPropostaRequestDTO, @MappingTarget ContraProposta contraProposta);

}
