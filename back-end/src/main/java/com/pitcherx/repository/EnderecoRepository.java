package com.pitcherx.repository;

import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pitcherx.model.Endereco;

@Repository
public interface EnderecoRepository extends JpaRepository<Endereco, Long>{


    /** Usado na exclusão de conta. */
    @Modifying
    @Query("DELETE FROM Endereco e WHERE e.usuario.idUsuario = :usuarioId")
    int apagarDoUsuario(@Param("usuarioId") Long usuarioId);
}
