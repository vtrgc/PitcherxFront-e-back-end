package com.pitcherx.repository;

import com.pitcherx.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    boolean existsUsuarioByEmailUsuario(String emailUsuario);

    boolean existsUsuarioByEmailUsuarioAndIdUsuarioNot(String emailUsuario, Long idUsuario);

    Optional<Usuario> findUserByEmailUsuario(String emailUsuario);
}
