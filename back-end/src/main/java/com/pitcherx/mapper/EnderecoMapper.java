package com.pitcherx.mapper;

import org.mapstruct.Mapper;


import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import com.pitcherx.dto.endereco.EnderecoRequestDTO;
import com.pitcherx.dto.endereco.EnderecoResponseDTO;
import com.pitcherx.model.Endereco;

@Mapper(componentModel = "spring")
public interface EnderecoMapper {
	
	@Mapping(source = "usuario.idUsuario", target = "usuarioId")
	EnderecoResponseDTO toDTO(Endereco endereco);
	
	@Mapping(target = "idEndereco", ignore = true)
	Endereco toEntity(EnderecoRequestDTO enderecoRequestDTO);

	void toUpdate(EnderecoRequestDTO enderecoRequestDTO, @MappingTarget Endereco endereco);
}
