package com.pitcherx.service;

import com.pitcherx.model.SenhaResetToken;
import com.pitcherx.model.Usuario;
import com.pitcherx.repository.SenhaResetTokenRepository;
import com.pitcherx.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class SenhaResetService {

    private final UsuarioRepository usuarioRepository;
    private final SenhaResetTokenRepository senhaResetTokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom random = new SecureRandom();

    public SenhaResetService(UsuarioRepository usuarioRepository, EmailService emailService, PasswordEncoder passwordEncoder, SenhaResetTokenRepository senhaResetTokenRepository) {
        this.usuarioRepository = usuarioRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        this.senhaResetTokenRepository = senhaResetTokenRepository;
    }

    @Transactional
    public void solicitarRedefinicaoSenha(String email) {
        Usuario usuario = usuarioRepository.findUserByEmailUsuario(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        String code = String.format("%06d", random.nextInt(999999));
        String hashedCode = passwordEncoder.encode(code);

        SenhaResetToken senhaResetToken = new SenhaResetToken();
        senhaResetToken.setUsuario(usuario);
        senhaResetToken.setTokenHash(hashedCode);
        senhaResetToken.setExpiresAt(Instant.now().plus(15, ChronoUnit.MINUTES));
        senhaResetToken.setUsed(false);
        senhaResetTokenRepository.save(senhaResetToken);

        emailService.enviarEmailRedefinirSenha(usuario.getEmailUsuario(), usuario.getNomeUsuario(), code);
    }

    @Transactional(readOnly = true)
    public boolean validarToken(String email, String code) {
        List<SenhaResetToken> tokens = senhaResetTokenRepository.findByUsuarioEmailUsuarioAndUsedFalseOrderByCreatedAtDesc(email);
        for (SenhaResetToken t : tokens){
            if (t.getExpiresAt().isAfter(Instant.now()) && passwordEncoder.matches(code, t.getTokenHash())) {
                return true;
            }else{
                return false;
            }
        }
        return false;
    }

    @Transactional
    public void resetarSenha(String email, String code, String novaSenha) {
        List<SenhaResetToken> tokens = senhaResetTokenRepository.findByUsuarioEmailUsuarioAndUsedFalseOrderByCreatedAtDesc(email);
        for (SenhaResetToken t : tokens){
            if (t.getExpiresAt().isAfter(Instant.now()) && passwordEncoder.matches(code, t.getTokenHash())) {
                Usuario usuario = t.getUsuario();
                usuario.setSenhaUsuario(passwordEncoder.encode(novaSenha));
                usuarioRepository.save(usuario);
                t.setUsed(true);
                senhaResetTokenRepository.save(t);
                return;
            }
        }
        throw new IllegalArgumentException("Código de redefinição inválido ou expirado!");
    }

}
