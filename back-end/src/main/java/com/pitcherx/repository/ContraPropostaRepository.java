package com.pitcherx.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.pitcherx.model.ContraProposta;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContraPropostaRepository extends JpaRepository<ContraProposta, Long> {

    List<ContraProposta> findByProposta_IdProposta(Long propostaId);

    List<ContraProposta> findByUsuario_IdUsuario(Long usuarioId);

    List<ContraProposta> findByStatus(ContraProposta.StatusContraProposta status);

    List<ContraProposta> findByProposta_IdPropostaAndStatus(Long propostaId, ContraProposta.StatusContraProposta status);

    Optional<ContraProposta> findById(Long id);

    boolean existsByProposta_IdPropostaAndStatus(Long propostaId, ContraProposta.StatusContraProposta status);

}
