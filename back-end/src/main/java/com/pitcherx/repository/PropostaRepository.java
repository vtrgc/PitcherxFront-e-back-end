package com.pitcherx.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pitcherx.model.Proposta;

@Repository
public interface PropostaRepository extends JpaRepository<Proposta, Long> {

}
