package com.pitcherx.mapper;

import com.pitcherx.dto.denuncia.DenunciaAdminDecisionDTO;
import com.pitcherx.dto.denuncia.DenunciaApelacaoDTO;
import com.pitcherx.dto.denuncia.DenunciaRequestDTO;
import com.pitcherx.dto.denuncia.DenunciaResponseDTO;
import com.pitcherx.model.Denuncia;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface DenunciaMapper {

    DenunciaMapper INSTANCE = Mappers.getMapper(DenunciaMapper.class);

    @Mapping(target = "idDenuncia", ignore = true)
    @Mapping(target = "status", constant = "PENDENTE")
    @Mapping(target = "denuncianteId", ignore = true)
    @Mapping(target = "prioridade", ignore = true)
    @Mapping(target = "dataCriacao", ignore = true)
    @Mapping(target = "dataAtualizacao", ignore = true)
    @Mapping(target = "dataDecisao", ignore = true)
    @Mapping(target = "decisaoAdmin", ignore = true)
    @Mapping(target = "adminId", ignore = true)
    @Mapping(target = "acaoTomada", ignore = true)
    @Mapping(target = "apelacaoSolicitada", constant = "false")
    @Mapping(target = "apelacaoJustificativa", ignore = true)
    @Mapping(target = "apelacaoDecisao", ignore = true)
    @Mapping(target = "apelacaoData", ignore = true)
    Denuncia toEntity(DenunciaRequestDTO requestDTO);

    DenunciaResponseDTO toDTO(Denuncia denuncia);

    @Mapping(target = "idDenuncia", ignore = true)
    @Mapping(target = "tipoDenuncia", ignore = true)
    @Mapping(target = "alvoId", ignore = true)
    @Mapping(target = "categoria", ignore = true)
    @Mapping(target = "descricao", ignore = true)
    @Mapping(target = "denuncianteId", ignore = true)
    @Mapping(target = "prioridade", ignore = true)
    @Mapping(target = "dataCriacao", ignore = true)
    @Mapping(target = "dataAtualizacao", ignore = true)
    @Mapping(target = "dataDecisao", ignore = true)
    @Mapping(target = "decisaoAdmin", ignore = true)
    @Mapping(target = "adminId", ignore = true)
    @Mapping(target = "acaoTomada", ignore = true)
    @Mapping(target = "apelacaoSolicitada", ignore = true)
    @Mapping(target = "apelacaoJustificativa", ignore = true)
    @Mapping(target = "apelacaoDecisao", ignore = true)
    @Mapping(target = "apelacaoData", ignore = true)
    void updateDecision(DenunciaAdminDecisionDTO decisionDTO, @MappingTarget Denuncia denuncia);
}
