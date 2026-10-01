package com.pitcherx.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import com.pitcherx.dto.comentario.ComentarioRequestDTO;
import com.pitcherx.dto.comentario.ComentarioResponseDTO;
import com.pitcherx.model.Comentario;

@Mapper(componentModel = "spring")
public interface ComentarioMapper {

	@Mapping(source = "postagem.idPostagem", target = "postagemId")
	@Mapping(source = "usuario.idUsuario", target = "usuarioId")
	ComentarioResponseDTO toDTO(Comentario comentario);
	
	@Mapping(target = "idComentario", ignore = true)
	Comentario toEntity(ComentarioRequestDTO comentarioRequestDTO);
	
	void toUpdate(ComentarioRequestDTO comentarioRequestDTO, @MappingTarget Comentario comentario);
	
}
