package com.pitcherx.repository;

import com.pitcherx.model.SolicitacaoVinculo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SolicitacaoVinculoRepository extends JpaRepository<SolicitacaoVinculo, Long> {

    List<SolicitacaoVinculo> findByProjeto_IdProjeto(Long projetoId);

    List<SolicitacaoVinculo> findByProjeto_IdProjetoAndStatus(Long projetoId, String status);

    Optional<SolicitacaoVinculo> findByProjeto_IdProjetoAndSolicitante_IdUsuarioAndTipoVinculoDesejado_IdTipoVinculo(
            Long projetoId, Long solicitanteId, Long tipoVinculoDesejadoId);

    List<SolicitacaoVinculo> findBySolicitante_IdUsuario(Long solicitanteId);

    Optional<SolicitacaoVinculo> findByProjeto_IdProjetoAndSolicitante_IdUsuario(
            Long projetoId, Long solicitanteId);

    Optional<SolicitacaoVinculo> findByProjeto_IdProjetoAndSolicitante_IdUsuarioAndStatus(
            Long projetoId, Long solicitanteId, String status);
}