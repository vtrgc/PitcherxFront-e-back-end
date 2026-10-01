package com.pitcherx.repository;

import com.pitcherx.model.Curtida;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CurtidaRepository extends JpaRepository<Curtida, Long> {

    long countByTipoConteudo_IdTipoConteudoAndConteudoId(Long tipoConteudoId, Long conteudoId);

    boolean existsByUsuario_IdUsuarioAndTipoConteudo_IdTipoConteudoAndConteudoId(Long usuarioId, Long tipoConteudoId, Long conteudoId);

    Optional<Curtida> findByUsuario_IdUsuarioAndTipoConteudo_IdTipoConteudoAndConteudoId(Long usuarioId, Long tipoConteudoId, Long conteudoId);

}
