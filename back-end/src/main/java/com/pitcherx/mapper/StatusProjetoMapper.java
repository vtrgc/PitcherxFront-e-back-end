package com.pitcherx.mapper;

import org.mapstruct.Mapper;

import com.pitcherx.dto.statusProjeto.StatusProjetoResponseDTO;
import com.pitcherx.model.StatusProjeto;

@Mapper(componentModel = "spring")
public interface StatusProjetoMapper {
	
	StatusProjetoResponseDTO toDTO(StatusProjeto statusProjeto);

}
