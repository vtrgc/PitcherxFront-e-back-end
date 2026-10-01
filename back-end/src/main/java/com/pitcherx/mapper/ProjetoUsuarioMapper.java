package com.pitcherx.mapper;

import com.pitcherx.dto.projetoUsuario.ProjetoUsuarioResponseDTO;
import com.pitcherx.model.ProjetoUsuario;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ProjetoUsuarioMapper {

    @Mapping(source = "projeto.idProjeto", target = "projetoId")
    @Mapping(source = "usuario.idUsuario", target = "usuarioId")
    @Mapping(source = "usuario.nomeUsuario", target = "nomeUsuario")
    @Mapping(source = "tipoVinculo.idTipoVinculo", target = "tipoVinculoId")
    @Mapping(source = "tipoVinculo.nomeTipoVinculo", target = "nomeTipoVinculo")
    ProjetoUsuarioResponseDTO toDTO(ProjetoUsuario projetoUsuario);

}
