package com.pitcherx.repository;

import com.pitcherx.model.Usuario;
import com.pitcherx.security.RoleType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    boolean existsUsuarioByEmailUsuario(String emailUsuario);

    boolean existsUsuarioByEmailUsuarioAndIdUsuarioNot(String emailUsuario, Long idUsuario);

    Optional<Usuario> findUserByEmailUsuario(String emailUsuario);

    Optional<Usuario> findByCodigoVerificacao(String codigoVerificacao);

    List<Usuario> findByRoles_NomeRole(RoleType role);

    List<Usuario> findByStatusAnaliseIdentidade(String statusAnaliseIdentidade);

    Page<Usuario> findByStatusAnaliseIdentidade(String statusAnaliseIdentidade, Pageable pageable);
}
