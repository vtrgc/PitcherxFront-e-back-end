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
	@Mapping(target = "videos", expression = "java(postagem.getVideos().isEmpty() ? (postagem.getUrlVideoPostagem() == null ? java.util.List.of() : java.util.List.of(postagem.getUrlVideoPostagem())) : postagem.getVideos().stream().map(com.pitcherx.model.PostagemVideo::getUrlVideo).toList())")
	PostagemResponseDTO toDTO(Postagem postagem);
	
	@Mapping(target = "idPostagem", ignore = true)
	@Mapping(target = "imagens", ignore = true)
	@Mapping(target = "videos", ignore = true)
	Postagem toEntity(PostagemRequestDTO postagemRequestDTO);

	@Mapping(target = "urlImagemPostagem", ignore = true)
	@Mapping(target = "urlVideoPostagem", ignore = true)
	@Mapping(target = "imagens", ignore = true)
	@Mapping(target = "videos", ignore = true)
	void toUpdate(PostagemRequestDTO postagemRequestDTO, @MappingTarget Postagem postagem);
}
