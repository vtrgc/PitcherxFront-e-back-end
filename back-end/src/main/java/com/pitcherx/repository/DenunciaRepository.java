package com.pitcherx.repository;

import com.pitcherx.model.Denuncia;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DenunciaRepository extends JpaRepository<Denuncia, Long> {

    List<Denuncia> findByStatusOrderByDataCriacaoDesc(Denuncia.StatusDenuncia status);

    Page<Denuncia> findByStatus(Denuncia.StatusDenuncia status, Pageable pageable);

    Page<Denuncia> findByDenuncianteIdOrderByDataCriacaoDesc(Long denuncianteId, Pageable pageable);

    boolean existsByDenuncianteIdAndAlvoIdAndTipoDenuncia(Long denuncianteId, Long alvoId, Denuncia.TipoDenuncia tipoDenuncia);

    long countByDenuncianteIdAndDataCriacaoBetween(Long denuncianteId, LocalDateTime inicio, LocalDateTime fim);
}
