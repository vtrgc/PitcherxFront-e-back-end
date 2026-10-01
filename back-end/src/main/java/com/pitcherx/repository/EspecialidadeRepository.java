package com.pitcherx.repository;

import com.pitcherx.model.Especialidade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EspecialidadeRepository extends JpaRepository<Especialidade, Long> {

    boolean existsByNomeEspecialidade(String nomeEspecialidade);

    boolean existsByNomeEspecialidadeAndIdEspecialidadeNot(String nomeEspecialidade, Long idEspecialidade);

}
