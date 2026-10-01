package com.pitcherx.mapper;

import com.pitcherx.dto.usuario.UsuarioRequestDTO;
import com.pitcherx.dto.usuario.UsuarioResponseDTO;
import com.pitcherx.model.Usuario;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface UsuarioMapper {

    @Mapping(source = "active", target = "active")
    @Mapping(target = "roles", expression = "java(usuario.getRoles().stream().map(r -> r.getNomeRole().name()).toList())")
    UsuarioResponseDTO toDTO(Usuario usuario);

    @Mapping(target = "idUsuario", ignore = true)
    Usuario toEntity(UsuarioRequestDTO usuarioRequestDTO);

    void updateFromDTO(UsuarioRequestDTO usuarioRequestDTO, @MappingTarget Usuario usuario);

}
