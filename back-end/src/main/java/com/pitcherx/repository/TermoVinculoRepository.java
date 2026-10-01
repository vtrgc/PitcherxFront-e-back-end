package com.pitcherx.repository;

import com.pitcherx.model.TermoVinculo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TermoVinculoRepository extends JpaRepository<TermoVinculo, Long> {

    boolean existsByTituloTermoVinculo(String tituloTermoVinculo);

    boolean existsByTituloTermoVinculoAndIdTermoVinculoNot(String tituloTermoVinculo, Long idTermoVinculo);

}
