package com.pitcherx.repository;

import com.pitcherx.model.ProjetoInteracao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface ProjetoInteracaoRepository extends JpaRepository<ProjetoInteracao, Long> {

    boolean existsByProjeto_IdProjetoAndUsuario_IdUsuarioAndTipoInteracao(
            Long projetoId, Long usuarioId, ProjetoInteracao.TipoInteracao tipoInteracao);

    Optional<ProjetoInteracao> findTopByProjeto_IdProjetoAndUsuario_IdUsuarioAndTipoInteracaoOrderByDataInteracaoDesc(
            Long projetoId, Long usuarioId, ProjetoInteracao.TipoInteracao tipoInteracao);

    long countByProjeto_IdProjetoAndTipoInteracao(Long projetoId, ProjetoInteracao.TipoInteracao tipoInteracao);

    void deleteByProjeto_IdProjetoAndUsuario_IdUsuarioAndTipoInteracao(
            Long projetoId, Long usuarioId, ProjetoInteracao.TipoInteracao tipoInteracao);
}
