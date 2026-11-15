package com.pitcherx.security;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import com.pitcherx.model.Usuario;

class PermissoesTest {

    private final Permissoes permissoes = new Permissoes();

    private void logar(long id, String... roles) {
        Usuario u = new Usuario();
        u.setIdUsuario(id);
        var authorities = java.util.Arrays.stream(roles).map(r -> new SimpleGrantedAuthority("ROLE_" + r)).toList();
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(u, null, authorities));
    }

    @AfterEach
    void limpar() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void semLoginNegaAcesso() {
        assertThrows(AccessDeniedException.class, permissoes::usuarioAtual);
        assertFalse(permissoes.isAdmin());
    }

    @Test
    void proprioUsuarioPodeAgirEmSeuNome() {
        logar(7, "USUARIO");
        assertEquals(7L, permissoes.idUsuarioAtual());
        assertDoesNotThrow(() -> permissoes.exigirProprio(7L, "x"));
        assertDoesNotThrow(() -> permissoes.exigirProprioOuAdmin(7L, "x"));
    }

    @Test
    void outroUsuarioENegado() {
        logar(7, "USUARIO");
        AccessDeniedException e = assertThrows(AccessDeniedException.class, () -> permissoes.exigirProprio(8L, "Só o dono"));
        assertEquals("Só o dono", e.getMessage());
        assertThrows(AccessDeniedException.class, () -> permissoes.exigirProprioOuAdmin(8L, "x"));
    }

    @Test
    void adminModeraMasNaoAgeEmNomeDeOutros() {
        logar(1, "ADMIN");
        assertTrue(permissoes.isAdmin());
        assertDoesNotThrow(() -> permissoes.exigirProprioOuAdmin(8L, "x"));
        assertThrows(AccessDeniedException.class, () -> permissoes.exigirProprio(8L, "x"));
    }

    @Test
    void rolesNaoAdminNaoSaoAdmin() {
        logar(3, List.of("USUARIO", "EMPRESA").toArray(String[]::new));
        assertFalse(permissoes.isAdmin());
    }
}
