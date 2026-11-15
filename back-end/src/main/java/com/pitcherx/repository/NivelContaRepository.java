package com.pitcherx.repository;

import com.pitcherx.model.NivelConta;
import com.pitcherx.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NivelContaRepository extends JpaRepository<NivelConta, Long> {

    Optional<NivelConta> findByNome(NivelConta.NivelContaNome nome);

    List<NivelConta> findAllByOrderByOrdemAsc();
}
