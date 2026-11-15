package com.pitcherx.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import com.pitcherx.dto.proposta.PropostaRequestDTO;
import com.pitcherx.dto.proposta.PropostaResponseDTO;
import com.pitcherx.model.Proposta;

@Mapper(componentModel = "spring")
public interface PropostaMapper {

	// Antes o id era ignorado e projeto/autor não eram mapeados: toda resposta vinha com
	// idProposta e projetoId nulos, impedindo aceitar, recusar ou contrapropor pelo front.
	@Mapping(target = "statusProposta", defaultValue = "PENDENTE")
	@Mapping(source = "projeto.idProjeto", target = "projetoId")
	@Mapping(source = "usuario.idUsuario", target = "usuarioId")
	@Mapping(source = "usuario.nomeUsuario", target = "usuarioNome")
	PropostaResponseDTO toDTO(Proposta proposta);
	
	@Mapping(target = "idProposta", ignore = true)
	@Mapping(target = "projeto", ignore = true)
	@Mapping(target = "usuario", ignore = true)
	Proposta toEntity(PropostaRequestDTO propostaRequestDTO);
	
	@Mapping(target = "idProposta", ignore = true)
	@Mapping(target = "projeto", ignore = true)
	@Mapping(target = "usuario", ignore = true)
	@Mapping(target = "statusProposta", ignore = true)
	void toUpdate(PropostaRequestDTO propostaRequestDTO, @MappingTarget Proposta proposta);
}
