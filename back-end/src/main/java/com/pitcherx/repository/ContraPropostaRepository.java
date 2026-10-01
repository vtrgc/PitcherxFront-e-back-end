package com.pitcherx.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pitcherx.model.ContraProposta;

@Repository
public interface ContraPropostaRepository extends JpaRepository<ContraProposta, Long> {

}
