package com.pitcherx.mapper;

import com.pitcherx.dto.solicitacaoVinculo.SolicitacaoVinculoRequestDTO;
import com.pitcherx.dto.solicitacaoVinculo.SolicitacaoVinculoResponseDTO;
import com.pitcherx.model.SolicitacaoVinculo;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface SolicitacaoVinculoMapper {

    @Mapping(source = "projeto.idProjeto", target = "projetoId")
    @Mapping(source = "projeto.nomeProjeto", target = "nomeProjeto")
    @Mapping(source = "solicitante.idUsuario", target = "solicitanteId")
    @Mapping(source = "solicitante.nomeUsuario", target = "nomeSolicitante")
    @Mapping(source = "solicitante.emailUsuario", target = "emailSolicitante")
    @Mapping(source = "tipoVinculoDesejado.idTipoVinculo", target = "tipoVinculoDesejadoId")
    @Mapping(source = "tipoVinculoDesejado.nomeTipoVinculo", target = "nomeTipoVinculoDesejado")
    SolicitacaoVinculoResponseDTO toDTO(SolicitacaoVinculo solicitacaoVinculo);

    @Mapping(target = "idSolicitacaoVinculo", ignore = true)
    @Mapping(target = "projeto", ignore = true)
    @Mapping(target = "solicitante", ignore = true)
    @Mapping(target = "tipoVinculoDesejado", ignore = true)
    @Mapping(target = "status", constant = "PENDENTE")
    @Mapping(target = "dataSolicitacao", expression = "java(java.time.LocalDateTime.now())")
    @Mapping(target = "dataResposta", ignore = true)
    SolicitacaoVinculo toEntity(SolicitacaoVinculoRequestDTO dto);

    @Mapping(target = "idSolicitacaoVinculo", ignore = true)
    @Mapping(target = "projeto", ignore = true)
    @Mapping(target = "solicitante", ignore = true)
    @Mapping(target = "tipoVinculoDesejado", ignore = true)
    @Mapping(target = "dataSolicitacao", ignore = true)
    void updateFromDTO(SolicitacaoVinculoRequestDTO dto, @MappingTarget SolicitacaoVinculo solicitacaoVinculo);

}