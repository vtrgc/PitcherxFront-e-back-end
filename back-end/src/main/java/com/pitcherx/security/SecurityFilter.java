package com.pitcherx.security;

import com.pitcherx.model.Usuario;
import com.pitcherx.repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class SecurityFilter extends OncePerRequestFilter {

    private final TokenConfig tokenConfig;
    private final UsuarioRepository usuarioRepository;

    public SecurityFilter(TokenConfig tokenConfig, UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
        this.tokenConfig = tokenConfig;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException{
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring("Bearer ".length());
            Optional<JWTUserData> userDataOpt = tokenConfig.validateToken(token);
            if (userDataOpt.isPresent()) {
                JWTUserData userData = userDataOpt.get();

                Usuario usuario = usuarioRepository.findUserByEmailUsuario(userData.emailUsuario())
                        .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado!"));

                Set<SimpleGrantedAuthority> authorities = Optional.ofNullable(userData.roles())
                        .orElse(Collections.emptySet())
                        .stream()
                        .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getNomeRole().name()))
                        .collect(Collectors.toSet());

                UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(usuario, null, authorities);
                SecurityContextHolder.getContext().setAuthentication(authenticationToken);
            }
        }
        filterChain.doFilter(request, response);
    }

}
