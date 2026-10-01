package com.pitcherx.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import com.pitcherx.dto.subComentario.SubComentarioRequestDTO;
import com.pitcherx.dto.subComentario.SubComentarioResponseDTO;
import com.pitcherx.model.SubComentario;

@Mapper(componentModel = "spring")
public interface SubComentarioMapper {

	@Mapping(source = "comentario.idComentario", target = "comentarioId")
	SubComentarioResponseDTO toDTO(SubComentario subComentario);
	
	@Mapping(target = "idSubComentario", ignore = true)
	SubComentario toEntity(SubComentarioRequestDTO subComentarioRequestDTO);
	
	void toUpdate(SubComentarioRequestDTO subComentarioRequestDTO, @MappingTarget SubComentario subComentario);
	
}
