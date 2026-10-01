package com.pitcherx.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import com.pitcherx.dto.postagem.PostagemRequestDTO;
import com.pitcherx.dto.postagem.PostagemResponseDTO;
import com.pitcherx.model.Postagem;

@Mapper(componentModel = "spring")
public interface PostagemMapper {
	
	@Mapping(source = "usuario.idUsuario", target = "usuarioId")
	@Mapping(target = "imagens", expression = "java(postagem.getImagens().isEmpty() ? (postagem.getUrlImagemPostagem() == null ? java.util.List.of() : java.util.List.of(postagem.getUrlImagemPostagem())) : postagem.getImagens().stream().map(com.pitcherx.model.PostagemImagem::getUrlImagem).toList())")
	PostagemResponseDTO toDTO(Postagem postagem);
	
	@Mapping(target = "idPostagem", ignore = true)
	Postagem toEntity(PostagemRequestDTO postagemRequestDTO);

	@Mapping(target = "urlImagemPostagem", ignore = true)
	void toUpdate(PostagemRequestDTO postagemRequestDTO, @MappingTarget Postagem postagem);
}
