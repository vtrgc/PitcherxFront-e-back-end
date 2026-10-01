package com.pitcherx.repository;

import com.pitcherx.model.Termo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TermoRepository extends JpaRepository<Termo, Long> {
}
