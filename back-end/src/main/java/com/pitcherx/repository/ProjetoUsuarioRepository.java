package com.pitcherx.repository;

import com.pitcherx.model.ProjetoUsuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjetoUsuarioRepository extends JpaRepository<ProjetoUsuario, Long> {

    boolean existsByUsuario_IdUsuarioAndProjeto_IdProjeto(Long usuarioId, Long projetoId);

    List<ProjetoUsuario> findByProjeto_IdProjeto(Long idProjeto);

    List<ProjetoUsuario> findByUsuario_IdUsuario(Long idUsuario);

    boolean existsByUsuario_IdUsuarioAndProjeto_IdProjetoAndTipoVinculo_IdTipoVinculo(Long usuarioId, Long projetoId, Long tipoVinculoId);

}
