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
	ContraPropostaResponseDTO toDTO(ContraProposta contraProposta);
	
	@Mapping(target = "idContraProposta", ignore = true)
	ContraProposta toEntity(ContraPropostaRequestDTO contraPropostaRequestDTO);
	
	void toUpdate(ContraPropostaRequestDTO contraPropostaRequestDTO, @MappingTarget ContraProposta contraProposta);
	
}
