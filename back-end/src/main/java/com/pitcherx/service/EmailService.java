package com.pitcherx.service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.LocalDate;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    public EmailService(JavaMailSender mailSender, TemplateEngine templateEngine) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
    }

    @Transactional
    public void enviarSaudacoes(String email, String nome) {
        try {
            Context context = new Context();
            context.setVariable("nome", nome != null ? nome : "Usuário");
            context.setVariable("email", email);
            context.setVariable("ano", LocalDate.now().getYear());

            String htmlContent = templateEngine.process("bem-vindo-pitherx.html", context);

            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper messageHelper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            messageHelper.setTo(email);
            messageHelper.setSubject("Bem-vindo ao PitcherX!");
            messageHelper.setText(htmlContent, true);
            messageHelper.setFrom("matheusviniciusgali05@gmail.com");
            mailSender.send(mimeMessage);

        } catch (MailException e) {
            throw new RuntimeException("Falha ao enviar email de saudações", e);
        } catch (Exception e) {
            throw new RuntimeException("Erro ao processar envio de email", e);
        }
    }

    @Transactional
    public void enviarEmailRedefinirSenha(String email, String nome, String codigo) {
        try {
            Context context = new Context();
            context.setVariable("nome", nome != null ? nome : "Usuário");
            context.setVariable("email", email);
            context.setVariable("codigoRedefinicao", codigo);
            context.setVariable("ano", LocalDate.now().getYear());

            String htmlContent = templateEngine.process("codigo-redefinir-senha.html", context);

            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper messageHelper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            messageHelper.setTo(email);
            messageHelper.setSubject("Redefinição de Senha - PitcherX");
            messageHelper.setText(htmlContent, true);
            messageHelper.setFrom("matheusviniciusgali05@gmail.com");

            mailSender.send(mimeMessage);

        } catch (MailException e) {
            throw new RuntimeException("Falha ao enviar email de redefinição de senha", e);
        } catch (Exception e) {
            throw new RuntimeException("Erro ao processar envio de email", e);
        }
    }

}
