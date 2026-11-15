package com.pitcherx.service;

import com.pitcherx.dto.solicitacaoVinculo.SolicitacaoVinculoRequestDTO;
import com.pitcherx.dto.solicitacaoVinculo.SolicitacaoVinculoResponseDTO;
import com.pitcherx.mapper.SolicitacaoVinculoMapper;
import com.pitcherx.model.Projeto;
import com.pitcherx.model.ProjetoUsuario;
import com.pitcherx.model.SolicitacaoVinculo;
import com.pitcherx.model.TipoVinculo;
import com.pitcherx.model.TipoVinculoEnum;
import com.pitcherx.model.Usuario;
import com.pitcherx.repository.ProjetoRepository;
import com.pitcherx.repository.ProjetoUsuarioRepository;
import com.pitcherx.repository.SolicitacaoVinculoRepository;
import com.pitcherx.repository.TipoVinculoRepository;
import com.pitcherx.repository.UsuarioRepository;
import com.pitcherx.service.EmailService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.mail.internet.MimeMessage;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class SolicitacaoVinculoService {

    private final SolicitacaoVinculoRepository solicitacaoVinculoRepository;
    private final SolicitacaoVinculoMapper solicitacaoVinculoMapper;
    private final ProjetoRepository projetoRepository;
    private final ProjetoUsuarioRepository projetoUsuarioRepository;
    private final UsuarioRepository usuarioRepository;
    private final TipoVinculoRepository tipoVinculoRepository;
    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    public SolicitacaoVinculoService(SolicitacaoVinculoRepository solicitacaoVinculoRepository,
                                     SolicitacaoVinculoMapper solicitacaoVinculoMapper,
                                     ProjetoRepository projetoRepository,
                                     ProjetoUsuarioRepository projetoUsuarioRepository,
                                     UsuarioRepository usuarioRepository,
                                     TipoVinculoRepository tipoVinculoRepository,
                                     JavaMailSender mailSender, TemplateEngine templateEngine) {
        this.solicitacaoVinculoRepository = solicitacaoVinculoRepository;
        this.solicitacaoVinculoMapper = solicitacaoVinculoMapper;
        this.projetoRepository = projetoRepository;
        this.projetoUsuarioRepository = projetoUsuarioRepository;
        this.usuarioRepository = usuarioRepository;
        this.tipoVinculoRepository = tipoVinculoRepository;
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
    }

    @Transactional(readOnly = true)
    public List<SolicitacaoVinculoResponseDTO> listarPorProjeto(Long projetoId) {
        if (!projetoRepository.existsById(projetoId)) {
            throw new EntityNotFoundException("Sem projeto com o ID informado!");
        }
        return solicitacaoVinculoRepository.findByProjeto_IdProjeto(projetoId).stream()
                .map(solicitacaoVinculoMapper::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SolicitacaoVinculoResponseDTO> listarPendentesPorProjeto(Long projetoId) {
        if (!projetoRepository.existsById(projetoId)) {
            throw new EntityNotFoundException("Sem projeto com o ID informado!");
        }
        return solicitacaoVinculoRepository.findByProjeto_IdProjetoAndStatus(projetoId, "PENDENTE").stream()
                .map(solicitacaoVinculoMapper::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<SolicitacaoVinculoResponseDTO> listarPorProjetoEUsuario(Long projetoId, Long usuarioId) {
        if (!projetoRepository.existsById(projetoId)) {
            throw new EntityNotFoundException("Sem projeto com o ID informado!");
        }
        return solicitacaoVinculoRepository.findByProjeto_IdProjetoAndSolicitante_IdUsuario(projetoId, usuarioId)
                .map(solicitacaoVinculoMapper::toDTO);
    }

    @Transactional(readOnly = true)
    public List<SolicitacaoVinculoResponseDTO> listarPorSolicitante(Long solicitanteId) {
        return solicitacaoVinculoRepository.findBySolicitante_IdUsuario(solicitanteId).stream()
                .map(solicitacaoVinculoMapper::toDTO)
                .toList();
    }

    @Transactional
    public SolicitacaoVinculoResponseDTO solicitarVinculo(Long projetoId, Long solicitanteId, Long tipoVinculoDesejadoId) {
        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new EntityNotFoundException("Sem projeto com o ID informado!"));

        Usuario solicitante = usuarioRepository.findById(solicitanteId)
                .orElseThrow(() -> new EntityNotFoundException("Sem usuário com o ID informado!"));

        // Check if user already has a pending request for this project
        Optional<SolicitacaoVinculo> existing = solicitacaoVinculoRepository
                .findByProjeto_IdProjetoAndSolicitante_IdUsuarioAndStatus(projetoId, solicitante.getIdUsuario(), "PENDENTE");

        if (existing.isPresent()) {
            throw new IllegalArgumentException("Você já possui uma solicitação pendente para este projeto.");
        }

        // Verificar se o usuário aceitou os termos de vinculo deste projeto
        ProjetoUsuario projUser = projetoUsuarioRepository
                .findByProjeto_IdProjetoAndUsuario_IdUsuario(projetoId, solicitante.getIdUsuario())
                .orElse(null);

        if (projUser == null || !projUser.getAceitouTermos()) {
            throw new IllegalArgumentException("É necessário aceitar os termos de vinculo do projeto antes de solicitar um novo vinculo.");
        }

        // Buscar o tipo de vínculo desejado pelo ID informado
        TipoVinculo tipoDesejado = tipoVinculoRepository.findById(tipoVinculoDesejadoId)
                .orElseThrow(() -> new EntityNotFoundException("Sem tipo de vínculo com o ID informado!"));

        // Validar que apenas SOCIO ou INVESTIDOR podem ser solicitados via esta via
        // (CRIADOR é definido automaticamente na criação do projeto;
        //  VISUALIZADOR é obtido automaticamente ao aceitar os termos de vinculo)
        String nomeTipoDesejado = tipoDesejado.getNomeTipoVinculo();
        if (!nomeTipoDesejado.equals(TipoVinculoEnum.SOCIO.toString())
                && !nomeTipoDesejado.equals(TipoVinculoEnum.INVESTIDOR.toString())) {
            throw new IllegalArgumentException(
                    "Apenas os tipos de vínculo SOCIO ou INVESTIDOR podem ser solicitados. " +
                            "Para ser VISUALIZADOR, aceite os termos de vinculo do projeto; " +
                            "CRIADOR é atribuído automaticamente ao criar um projeto.");
        }

        SolicitacaoVinculo solicitacao = new SolicitacaoVinculo();
        solicitacao.setProjeto(projeto);
        solicitacao.setSolicitante(solicitante);
        solicitacao.setTipoVinculoDesejado(tipoDesejado);
        solicitacao.setStatus("PENDENTE");
        solicitacao.setDataSolicitacao(LocalDate.now().atStartOfDay());

        SolicitacaoVinculo salvo = solicitacaoVinculoRepository.save(solicitacao);

        // Enviar email para o criador do projeto
        try {
            enviarEmailSolicitacaoParaCriador(salvo, solicitante);
        } catch (MailException e) {
            throw new RuntimeException("Falha ao enviar email de solicitação de vínculo", e);
        }

        return solicitacaoVinculoMapper.toDTO(salvo);
    }

    @Transactional
    public SolicitacaoVinculoResponseDTO aprovarSolicitacao(Long idSolicitacao, Long usuarioIdCriador) {
        SolicitacaoVinculo solicitacao = solicitacaoVinculoRepository.findById(idSolicitacao)
                .orElseThrow(() -> new EntityNotFoundException("Solicitação não encontrada!"));

        // Verificar se o usuário é o criador do projeto
        Projeto projeto = solicitacao.getProjeto();
        Usuario criador = getProjetoCriador(projeto.getIdProjeto());
        if (criador == null || !criador.getIdUsuario().equals(usuarioIdCriador)) {
            throw new SecurityException("Apenas o criador do projeto pode aprovar solicitações.");
        }

        // Atualizar status para ACEITE
        solicitacao.setStatus("ACEITE");
        solicitacao.setDataResposta(LocalDate.now().atStartOfDay());

        // Atualizar o vínculo do solicitante no projeto
        // Buscar o usuário solicitante
        Usuario solicitante = solicitacao.getSolicitante();

        // Primeiro, remover qualquer vínculo existente com tipo VISUALIZADOR
        ProjetoUsuario projUser = projetoUsuarioRepository
                .findByProjeto_IdProjetoAndUsuario_IdUsuario(projeto.getIdProjeto(), solicitante.getIdUsuario())
                .orElse(null);

        if (projUser != null) {
            // Substituir o tipo de vínculo para SOCIO ou INVESTIDOR baseado no solicitado
            String nomeTipo = solicitacao.getTipoVinculoDesejado().getNomeTipoVinculo();

            // Se o vínculo anterior era VISUALIZADOR, atualizar para o novo tipo
            if (projUser.getTipoVinculo().getNomeTipoVinculo().equals(TipoVinculoEnum.VISUALIZADOR.toString())) {
                projUser.setTipoVinculo(solicitacao.getTipoVinculoDesejado());
                projUser.setAceitouTermos(true);
                // Manter dataAceite se já existia, senão definir
                if (projUser.getDataAceite() == null) {
                    projUser.setDataAceite(LocalDate.now().atStartOfDay());
                }
                projetoUsuarioRepository.save(projUser);
            } else if (!projUser.getTipoVinculo().getNomeTipoVinculo().equals(nomeTipo)) {
                // Se já era outro tipo (ex: CRIADOR), atualizar para o novo tipo
                projUser.setTipoVinculo(solicitacao.getTipoVinculoDesejado());
                projetoUsuarioRepository.save(projUser);
            }
        } else {
            // Criar novo vínculo
            TipoVinculo tipoDesejado = solicitacao.getTipoVinculoDesejado();

            ProjetoUsuario novoVinculo = new ProjetoUsuario();
            novoVinculo.setProjeto(projeto);
            novoVinculo.setUsuario(solicitante);
            novoVinculo.setTipoVinculo(tipoDesejado);
            novoVinculo.setAceitouTermos(true);
            novoVinculo.setDataAceite(LocalDate.now().atStartOfDay());

            projetoUsuarioRepository.save(novoVinculo);
        }

        solicitacaoVinculoRepository.save(solicitacao);

        // Enviar email de notificação para o solicitante
        try {
            // Extrair dados do próprio solicitacao em vez de usar variable 'salvo' de outro método
            Usuario s = solicitacao.getSolicitante();
            String emailSolicitante = s.getEmailUsuario();
            String nomeSolicitante = s.getNomeUsuario();
            String nomeCriador = getProjetoCriador(projeto.getIdProjeto()).getNomeUsuario();
            String tipoConcedido = solicitacao.getTipoVinculoDesejado().getNomeTipoVinculo();
            String nomeProjeto = solicitacao.getProjeto().getNomeProjeto();

            Context context = new Context();
            context.setVariable("nomeSolicitante", nomeSolicitante);
            context.setVariable("nomeCriador", nomeCriador);
            context.setVariable("tipoConcedido", tipoConcedido);
            context.setVariable("nomeProjeto", nomeProjeto);
            context.setVariable("ano", LocalDate.now().getYear());

            String htmlContent = templateEngine.process("solicitacao-aprovada.html", context);

            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper messageHelper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            messageHelper.setTo(emailSolicitante);
            messageHelper.setSubject("Solicitação aprovada - PitcherX");
            messageHelper.setText(htmlContent, true);
            messageHelper.setFrom("matheusviniciusgali05@gmail.com");
            mailSender.send(mimeMessage);

        } catch (Exception e) {
            throw new RuntimeException("Falha ao enviar email de aprovação", e);
        }

        return solicitacaoVinculoMapper.toDTO(solicitacao);
    }

    @Transactional
    public SolicitacaoVinculoResponseDTO rejeitarSolicitacao(Long idSolicitacao, Long usuarioIdCriador) {
        SolicitacaoVinculo solicitacao = solicitacaoVinculoRepository.findById(idSolicitacao)
                .orElseThrow(() -> new EntityNotFoundException("Solicitação não encontrada!"));

        // Verificar se o usuário é o criador do projeto
        Projeto projeto = solicitacao.getProjeto();
        Usuario criador = getProjetoCriador(projeto.getIdProjeto());
        if (criador == null || !criador.getIdUsuario().equals(usuarioIdCriador)) {
            throw new SecurityException("Apenas o criador do projeto pode rejeitar solicitações.");
        }

        solicitacao.setStatus("RECUSADA");
        solicitacao.setDataResposta(LocalDate.now().atStartOfDay());
        solicitacaoVinculoRepository.save(solicitacao);

        // Enviar email de notificação para o solicitante
        try {
            enviarEmailAprovacaoParaSolicitante(solicitacao);
        } catch (MailException e) {
            throw new RuntimeException("Falha ao enviar email de aprovação", e);
        }

        return solicitacaoVinculoMapper.toDTO(solicitacao);
    }

    private void enviarEmailSolicitacaoParaCriador(SolicitacaoVinculo solicitacao, Usuario solicitante) {
        try {
            Usuario criador = getProjetoCriador(solicitacao.getProjeto().getIdProjeto());
            if (criador == null) {
                throw new RuntimeException("Não foi possível encontrar o criador do projeto");
            }
            String emailCriador = criador.getEmailUsuario();
            String nomeCriador = criador.getNomeUsuario();
            String nomeSolicitante = solicitante.getNomeUsuario();
            String tipoDesejado = solicitacao.getTipoVinculoDesejado().getNomeTipoVinculo();
            String nomeProjeto = solicitacao.getProjeto().getNomeProjeto();

            Context context = new Context();
            context.setVariable("nomeCriador", nomeCriador);
            context.setVariable("nomeSolicitante", nomeSolicitante);
            context.setVariable("tipoDesejado", tipoDesejado);
            context.setVariable("nomeProjeto", nomeProjeto);
            context.setVariable("ano", LocalDate.now().getYear());

            String htmlContent = templateEngine.process("solicitacao-vinculo.html", context);

            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper messageHelper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            messageHelper.setTo(emailCriador);
            messageHelper.setSubject("Nova solicitação de vínculo - PitcherX");
            messageHelper.setText(htmlContent, true);
            messageHelper.setFrom("matheusviniciusgali05@gmail.com");
            try {
                mailSender.send(mimeMessage);
            } catch (Exception e) {
                throw new RuntimeException("Falha ao enviar email", e);
            }

        } catch (Exception e) {
            throw new RuntimeException("Erro ao processar envio de email", e);
        }
    }

    private void enviarEmailAprovacaoParaSolicitante(SolicitacaoVinculo solicitacao) {
        try {
            Usuario solicitante = solicitacao.getSolicitante();
            if (solicitante == null) {
                throw new RuntimeException("Solicitante nulo");
            }
            String emailSolicitante = solicitante.getEmailUsuario();
            String nomeSolicitante = solicitante.getNomeUsuario();
            String nomeCriador = getProjetoCriador(solicitacao.getProjeto().getIdProjeto()).getNomeUsuario();
            String tipoConcedido = solicitacao.getTipoVinculoDesejado().getNomeTipoVinculo();
            String nomeProjeto = solicitacao.getProjeto().getNomeProjeto();

            Context context = new Context();
            context.setVariable("nomeSolicitante", nomeSolicitante);
            context.setVariable("nomeCriador", nomeCriador);
            context.setVariable("tipoConcedido", tipoConcedido);
            context.setVariable("nomeProjeto", nomeProjeto);
            context.setVariable("ano", LocalDate.now().getYear());

            String htmlContent = templateEngine.process("solicitacao-aprovada.html", context);

            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper messageHelper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            messageHelper.setTo(emailSolicitante);
            messageHelper.setSubject("Solicitação aprovada - PitcherX");
            messageHelper.setText(htmlContent, true);
            messageHelper.setFrom("matheusviniciusgali05@gmail.com");
            mailSender.send(mimeMessage);

        } catch (Exception e) {
            throw new RuntimeException("Erro ao processar envio de email", e);
        }
    }

    private void enviarEmailRejeicaoParaSolicitante(SolicitacaoVinculo solicitacao) {
        try {
            Usuario solicitante = solicitacao.getSolicitante();
            if (solicitante == null) {
                throw new RuntimeException("Solicitante nulo");
            }
            String emailSolicitante = solicitante.getEmailUsuario();
            String nomeSolicitante = solicitante.getNomeUsuario();
            String nomeCriador = getProjetoCriador(solicitacao.getProjeto().getIdProjeto()).getNomeUsuario();
            String nomeProjeto = solicitacao.getProjeto().getNomeProjeto();

            Context context = new Context();
            context.setVariable("nomeSolicitante", nomeSolicitante);
            context.setVariable("nomeCriador", nomeCriador);
            context.setVariable("nomeProjeto", nomeProjeto);
            context.setVariable("ano", LocalDate.now().getYear());

            String htmlContent = templateEngine.process("solicitacao-recusada.html", context);

            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper messageHelper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            messageHelper.setTo(emailSolicitante);
            messageHelper.setSubject("Solicitação recusada - PitcherX");
            messageHelper.setText(htmlContent, true);
            messageHelper.setFrom("matheusviniciusgali05@gmail.com");
            mailSender.send(mimeMessage);

        } catch (Exception e) {
            throw new RuntimeException("Erro ao processar envio de email", e);
        }
    }

    /**
     * Método auxiliar para obter o criador do projeto
     * @param projetoId ID do projeto
     * @return Usuario do criador ou null
     */
    private Usuario getProjetoCriador(Long projetoId) {
        // Buscar projeto usuario com tipo CRIADOR para este projeto
        List<ProjetoUsuario> pusu = projetoUsuarioRepository.findByProjeto_IdProjeto(projetoId);
        for (ProjetoUsuario pu : pusu) {
            if (pu.getTipoVinculo().getNomeTipoVinculo().equals("CRIADOR")) {
                return pu.getUsuario();
            }
        }
        return null;
    }
}