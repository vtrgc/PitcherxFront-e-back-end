package com.pitcherx.mapper;

import com.pitcherx.dto.conexao.ConexaoRequestDTO;
import com.pitcherx.dto.conexao.ConexaoResponseDTO;
import com.pitcherx.dto.conexao.ConexaoSimplesDTO;
import com.pitcherx.dto.conexao.UsuarioSimplesDTO;
import com.pitcherx.model.Conexao;
import com.pitcherx.model.Usuario;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ConexaoMapper {

    @Mapping(target = "seguidor", ignore = true)
    @Mapping(source = "seguidoId", target = "seguido.idUsuario")
    @Mapping(target = "idConexao", ignore = true)
    @Mapping(target = "status", constant = "PENDENTE")
    @Mapping(target = "dataSolicitacao", expression = "java(java.time.LocalDateTime.now())")
    @Mapping(target = "dataResposta", ignore = true)
    Conexao toEntity(ConexaoRequestDTO requestDTO);

    @Mapping(source = "seguidor.idUsuario", target = "seguidor.idUsuario")
    @Mapping(source = "seguidor.nomeUsuario", target = "seguidor.nomeUsuario")
    @Mapping(source = "seguidor.urlImagemUsuario", target = "seguidor.urlImagemUsuario")
    @Mapping(source = "seguidor.perfilUsuario.identificador", target = "seguidor.identificador")
    @Mapping(source = "seguido.idUsuario", target = "seguido.idUsuario")
    @Mapping(source = "seguido.nomeUsuario", target = "seguido.nomeUsuario")
    @Mapping(source = "seguido.urlImagemUsuario", target = "seguido.urlImagemUsuario")
    @Mapping(source = "seguido.perfilUsuario.identificador", target = "seguido.identificador")
    ConexaoResponseDTO toDTO(Conexao conexao);

    @Mapping(source = "usuario.idUsuario", target = "idUsuario")
    @Mapping(source = "usuario.nomeUsuario", target = "nomeUsuario")
    @Mapping(source = "usuario.urlImagemUsuario", target = "urlImagemUsuario")
    @Mapping(source = "usuario.perfilUsuario.identificador", target = "identificador")
    UsuarioSimplesDTO toUsuarioSimplesDTO(Usuario usuario);

    @Mapping(source = "seguidor.idUsuario", target = "id")
    @Mapping(source = "seguidor.nomeUsuario", target = "nome")
    @Mapping(source = "seguidor.urlImagemUsuario", target = "imagem")
    @Mapping(source = "seguidor.perfilUsuario.identificador", target = "identificador")
    ConexaoSimplesDTO toSeguidorSimplesDTO(Conexao conexao);

    @Mapping(source = "seguido.idUsuario", target = "id")
    @Mapping(source = "seguido.nomeUsuario", target = "nome")
    @Mapping(source = "seguido.urlImagemUsuario", target = "imagem")
    @Mapping(source = "seguido.perfilUsuario.identificador", target = "identificador")
    ConexaoSimplesDTO toSeguidoSimplesDTO(Conexao conexao);
}