package com.pitcherx.repository;

import com.pitcherx.model.TipoProjeto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TipoProjetoRepository extends JpaRepository<TipoProjeto, Long> {

    boolean existsByNomeTipoProjeto(String nomeTipoProjeto);

    boolean existsByNomeTipoProjetoAndIdTipoProjetoNot(String nomeTipoProjeto, Long idTipoProjeto);

}
