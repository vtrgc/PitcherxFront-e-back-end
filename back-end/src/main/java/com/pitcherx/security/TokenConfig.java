package com.pitcherx.security;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import org.springframework.stereotype.Component;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.pitcherx.model.Usuario;

@Component
public class TokenConfig {

    /**
     * Segredo do JWT: variável de ambiente JWT_SECRET (recomendado), depois a propriedade de
     * sistema jwt.secret.key. O valor padrão fixo só existe para desenvolvimento local — com ele,
     * qualquer pessoa que leia o código consegue gerar tokens válidos.
     */
    private static final String SECRET_KEY = resolverSegredo();

    private static String resolverSegredo() {
        String env = System.getenv("JWT_SECRET");
        if (env != null && !env.isBlank()) return env;
        String prop = System.getProperty("jwt.secret.key");
        if (prop != null && !prop.isBlank()) return prop;
        org.slf4j.LoggerFactory.getLogger(TokenConfig.class)
                .warn("JWT_SECRET não definido: usando o segredo padrão de desenvolvimento. Defina JWT_SECRET em produção.");
        return "secretKey";
    }

    private final Algorithm algorithm = Algorithm.HMAC256(SECRET_KEY);

    public String generateToken(Usuario usuario) {
        return JWT.create()
                .withClaim("idUsuario", usuario.getIdUsuario())
                .withSubject(usuario.getEmailUsuario())
                .withClaim("roles", usuario.getRoles().stream().map(role -> role.getNomeRole().name()).toList())
                // Antes: 365 dias. Um token vazado valia por um ano.
                .withExpiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .withIssuedAt(Instant.now())
                .sign(algorithm);
    }

    public Optional<JWTUserData> validateToken(String token) {
        try {
            DecodedJWT decodedJWT = JWT.require(algorithm).build().verify(token);
            var idUsuario = decodedJWT.getClaim("idUsuario").asLong();
            var emailUsuario = decodedJWT.getSubject();
            var roles = decodedJWT.getClaim("roles").asList(String.class);
            return Optional.of(new JWTUserData(idUsuario, emailUsuario, roles.stream().map(roleName -> new com.pitcherx.model.Role(RoleType.valueOf(roleName))).collect(java.util.stream.Collectors.toSet())));
        } catch (JWTVerificationException e) {
            return Optional.empty();
        }
    }
}
