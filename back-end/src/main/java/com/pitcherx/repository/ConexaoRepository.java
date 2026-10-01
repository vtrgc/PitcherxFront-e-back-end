package com.pitcherx.repository;

import com.pitcherx.model.Conexao;
import com.pitcherx.model.StatusConexao;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConexaoRepository extends JpaRepository<Conexao, Long> {

    Optional<Conexao> findBySeguidor_IdUsuarioAndSeguido_IdUsuario(Long seguidorId, Long seguidoId);

    boolean existsBySeguidor_IdUsuarioAndSeguido_IdUsuarioAndStatusIn(
            Long seguidorId, Long seguidoId, List<StatusConexao> statusList);

    long countBySeguido_IdUsuarioAndStatus(Long seguidoId, StatusConexao status);

    long countBySeguidor_IdUsuarioAndStatus(Long seguidorId, StatusConexao status);

    Page<Conexao> findBySeguido_IdUsuarioAndStatus(Long seguidoId, StatusConexao status, Pageable pageable);

    Page<Conexao> findBySeguidor_IdUsuarioAndStatus(Long seguidorId, StatusConexao status, Pageable pageable);

    @Query("SELECT c FROM Conexao c WHERE c.seguidor.idUsuario = :usuarioId AND c.status = :status")
    Page<Conexao> findBySeguidorIdAndStatusCustom(@Param("usuarioId") Long usuarioId,
                                                   @Param("status") StatusConexao status,
                                                   Pageable pageable);
}