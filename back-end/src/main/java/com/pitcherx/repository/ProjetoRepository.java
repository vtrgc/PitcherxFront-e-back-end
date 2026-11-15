package com.pitcherx.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.pitcherx.model.Projeto;

import java.util.List;

@Repository
public interface ProjetoRepository extends JpaRepository<Projeto, Long>, JpaSpecificationExecutor<Projeto> {

    @Query("SELECT COUNT(p) FROM Projeto p WHERE p.usuarioCriador.idUsuario = :usuarioId")
    long countByUsuarioCriadorId(@Param("usuarioId") Long usuarioId);

    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN TRUE ELSE FALSE END FROM Projeto p WHERE p.usuarioCriador.idUsuario = :usuarioId AND p.visualizacoes >= :visualizacoes AND p.seguidores >= :seguidores")
    boolean existsByUsuarioCriadorIdAndVisualizacoesGreaterThanEqualAndSeguidoresGreaterThanEqual(
            @Param("usuarioId") Long usuarioId,
            @Param("visualizacoes") Integer visualizacoes,
            @Param("seguidores") Integer seguidores);

    @Query("SELECT p FROM Projeto p WHERE p.tipoProjeto.nomeTipoProjeto LIKE CONCAT('%', :nomeArea, '%')")
    List<Projeto> findByTipoProjetoNomeContendo(@Param("nomeArea") String nomeArea);
}
