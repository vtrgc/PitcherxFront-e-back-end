package com.pitcherx.repository;

import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
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

    /** Usado na exclusão de conta. */
    @Modifying
    @Query("DELETE FROM ProjetoInteracao i WHERE i.usuario.idUsuario = :usuarioId")
    int apagarDoUsuario(@Param("usuarioId") Long usuarioId);
}
