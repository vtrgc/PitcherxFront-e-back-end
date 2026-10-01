package com.pitcherx.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import com.pitcherx.dto.proposta.PropostaRequestDTO;
import com.pitcherx.dto.proposta.PropostaResponseDTO;
import com.pitcherx.model.Proposta;

@Mapper(componentModel = "spring")
public interface PropostaMapper {

	PropostaResponseDTO toDTO(Proposta proposta);
	
	@Mapping(target = "idProposta", ignore = true)
	Proposta toEntity(PropostaRequestDTO propostaRequestDTO);
	
	void toUpdate(PropostaRequestDTO propostaRequestDTO, @MappingTarget Proposta proposta);
}
