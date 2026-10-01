package com.pitcherx.repository;

import com.pitcherx.model.TipoConteudo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TipoConteudoRepository extends JpaRepository<TipoConteudo, Long> {
}
