package com.pitcherx.repository;

import com.pitcherx.model.TermoVinculo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TermoVinculoRepository extends JpaRepository<TermoVinculo, Long> {

    boolean existsByTituloTermoVinculo(String tituloTermoVinculo);

    boolean existsByTituloTermoVinculoAndIdTermoVinculoNot(String tituloTermoVinculo, Long idTermoVinculo);

    boolean existsByTituloTermoVinculoAndProjeto_IdProjeto(String tituloTermoVinculo, Long projetoId);

    boolean existsByTituloTermoVinculoAndProjeto_IdProjetoAndIdTermoVinculoNot(String tituloTermoVinculo, Long projetoId, Long idTermoVinculo);

    List<TermoVinculo> findByProjeto_IdProjeto(Long projetoId);

    List<TermoVinculo> findByProjeto_IdProjetoAndObrigatorioTrue(Long projetoId);
}
