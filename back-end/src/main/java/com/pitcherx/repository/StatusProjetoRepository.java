package com.pitcherx.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pitcherx.model.StatusProjeto;

@Repository
public interface StatusProjetoRepository extends JpaRepository<StatusProjeto, Long>{

}
