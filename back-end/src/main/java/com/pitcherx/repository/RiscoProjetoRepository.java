package com.pitcherx.repository;

import com.pitcherx.model.RiscoProjeto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RiscoProjetoRepository extends JpaRepository<RiscoProjeto, Long> {

    boolean existsByNomeRisco(String nomeRisco);

    boolean existsByNomeRiscoAndIdRiscoProjetoNot(String nomeRisco, Long idRiscoProjeto);
}
