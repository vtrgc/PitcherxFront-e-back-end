package com.pitcherx.repository;

import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import com.pitcherx.model.SenhaResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SenhaResetTokenRepository extends JpaRepository<SenhaResetToken, Long> {
    List<SenhaResetToken> findByUsuarioEmailUsuarioAndUsedFalseOrderByCreatedAtDesc(String usuarioEmail);

    /** Usado na exclusão de conta. */
    @Modifying
    @Query("DELETE FROM SenhaResetToken t WHERE t.usuario.idUsuario = :usuarioId")
    int apagarDoUsuario(@Param("usuarioId") Long usuarioId);
}
