package com.pitcherx.repository;

import com.pitcherx.model.SenhaResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SenhaResetTokenRepository extends JpaRepository<SenhaResetToken, Long> {
    List<SenhaResetToken> findByUsuarioEmailUsuarioAndUsedFalseOrderByCreatedAtDesc(String usuarioEmail);
}
