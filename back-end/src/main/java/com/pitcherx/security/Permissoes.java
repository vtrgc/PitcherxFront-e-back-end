package com.pitcherx.security;

import java.util.Objects;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.pitcherx.model.Usuario;

/**
 * Regras de "quem pode fazer o quê" baseadas no usuário do token (SecurityFilter).
 *
 * Vários endpoints recebem o id do usuário na URL ou no corpo (curtida, comentário, postagem,
 * criação de projeto...). Sem esta verificação, qualquer conta autenticada agiria em nome de
 * outra. As falhas viram 403 pelo GlobalExceptionHandler (AccessDeniedException).
 */
@Component
public class Permissoes {

    /** Usuário autenticado (403 se não houver). */
    public Usuario usuarioAtual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Usuario usuario) {
            return usuario;
        }
        throw new AccessDeniedException("Faça login para continuar.");
    }

    public Long idUsuarioAtual() {
        return usuarioAtual().getIdUsuario();
    }

    public boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    /** Só o próprio usuário (ou um administrador). */
    public void exigirProprioOuAdmin(Long idUsuario, String mensagem) {
        if (isAdmin()) return;
        if (!Objects.equals(idUsuarioAtual(), idUsuario)) {
            throw new AccessDeniedException(mensagem);
        }
    }

    /** Só o próprio usuário — nem o administrador pode agir em nome de outra pessoa. */
    public void exigirProprio(Long idUsuario, String mensagem) {
        if (!Objects.equals(idUsuarioAtual(), idUsuario)) {
            throw new AccessDeniedException(mensagem);
        }
    }
}
