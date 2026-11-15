package com.pitcherx.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import com.pitcherx.model.Contrato;

@Repository
public interface ContratoRepository extends JpaRepository<Contrato, Long> {

    @Query("SELECT c FROM Contrato c WHERE c.proposta.id = ?1 AND c.statusContrato = ?2")
    Contrato findByPropostaIdAndStatusContrato(Long idProposta, String statusContrato);

}
