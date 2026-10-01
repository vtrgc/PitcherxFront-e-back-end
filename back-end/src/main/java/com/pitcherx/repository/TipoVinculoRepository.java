package com.pitcherx.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pitcherx.model.TipoVinculo;

@Repository
public interface TipoVinculoRepository extends JpaRepository<TipoVinculo, Long>{

	boolean existsTipoVinculoByNomeTipoVinculo(String nomeTipoVinculo);
	
}
