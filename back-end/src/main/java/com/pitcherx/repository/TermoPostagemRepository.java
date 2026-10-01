package com.pitcherx.repository;

import com.pitcherx.model.TermoPostagem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TermoPostagemRepository extends JpaRepository<TermoPostagem, Long> {

    boolean existsByTituloTermoPostagem(String tituloTermoPostagem);

    boolean existsByTituloTermoPostagemAndIdTermoPostagemNot(String tituloTermoPostagem, Long idTermoPostagem);


}
