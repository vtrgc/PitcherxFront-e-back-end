package com.pitcherx.repository;

import com.pitcherx.model.Notificacao;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificacaoRepository extends JpaRepository<Notificacao, Long> {

    @Query("SELECT n FROM Notificacao n WHERE n.usuario.idUsuario = :usuarioId ORDER BY n.dataCriacao DESC")
    Page<Notificacao> findByUsuarioIdOrderByDataCriacaoDesc(@Param("usuarioId") Long usuarioId, Pageable pageable);

    @Query("SELECT n FROM Notificacao n WHERE n.usuario.idUsuario = :usuarioId AND n.lida = false ORDER BY n.dataCriacao DESC")
    List<Notificacao> findByUsuarioIdAndLidaFalseOrderByDataCriacaoDesc(@Param("usuarioId") Long usuarioId);

    @Query("SELECT COUNT(n) FROM Notificacao n WHERE n.usuario.idUsuario = :usuarioId AND n.lida = false")
    long countByUsuarioIdAndLidaFalse(@Param("usuarioId") Long usuarioId);
}