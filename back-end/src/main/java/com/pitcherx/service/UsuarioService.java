package com.pitcherx.service;

import com.pitcherx.dto.usuario.AnaliseIdentidadeDTO;
import com.pitcherx.dto.usuario.RedefinirSenhaRequestDTO;
import com.pitcherx.dto.usuario.UsuarioRequestDTO;
import com.pitcherx.dto.usuario.UsuarioResponseDTO;
import com.pitcherx.dto.usuario.login.LoginRequestDTO;
import com.pitcherx.dto.usuario.login.LoginResponseDTO;
import com.pitcherx.exceptions.BusinessException;
import com.pitcherx.mapper.UsuarioMapper;
import com.pitcherx.model.NivelConta;
import com.pitcherx.model.Notificacao;
import com.pitcherx.model.Role;
import com.pitcherx.model.Usuario;
import com.pitcherx.repository.NivelContaRepository;
import com.pitcherx.repository.NotificacaoRepository;
import com.pitcherx.repository.ProjetoRepository;
import com.pitcherx.repository.ProjetoUsuarioRepository;
import com.pitcherx.repository.RoleRepository;
import com.pitcherx.repository.UsuarioRepository;
import com.pitcherx.security.RoleType;
import com.pitcherx.security.TokenConfig;
import com.pitcherx.utils.UploadUtil;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final UsuarioMapper usuarioMapper;
    private final RoleRepository roleRepository;
    private final NivelContaRepository nivelContaRepository;
    private final NotificacaoRepository notificacaoRepository;
    private final ProjetoRepository projetoRepository;
    private final ProjetoUsuarioRepository projetoUsuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenConfig tokenConfig;
    private final EmailService emailService;
    private final UploadUtil uploadUtil;

    public UsuarioService(UsuarioRepository usuarioRepository, UsuarioMapper usuarioMapper,
                          RoleRepository roleRepository, NivelContaRepository nivelContaRepository,
                          NotificacaoRepository notificacaoRepository, ProjetoRepository projetoRepository,
                          ProjetoUsuarioRepository projetoUsuarioRepository, PasswordEncoder passwordEncoder,
                          TokenConfig tokenConfig, EmailService emailService, UploadUtil uploadUtil) {
        this.usuarioRepository = usuarioRepository;
        this.usuarioMapper = usuarioMapper;
        this.roleRepository = roleRepository;
        this.nivelContaRepository = nivelContaRepository;
        this.notificacaoRepository = notificacaoRepository;
        this.projetoRepository = projetoRepository;
        this.projetoUsuarioRepository = projetoUsuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenConfig = tokenConfig;
        this.emailService = emailService;
        this.uploadUtil = uploadUtil;
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponseDTO> listarUsuarios() {
        return usuarioRepository.findAll().stream()
                .map(this::paraLeitura)
                .toList();
    }

    @org.springframework.beans.factory.annotation.Autowired
    private com.pitcherx.security.Permissoes permissoes;

    @org.springframework.beans.factory.annotation.Autowired
    private com.pitcherx.repository.ConexaoRepository conexaoRepository;
    @org.springframework.beans.factory.annotation.Autowired
    private com.pitcherx.repository.MensagemRepository mensagemRepository;
    @org.springframework.beans.factory.annotation.Autowired
    private com.pitcherx.repository.ConversaRepository conversaRepository;
    @org.springframework.beans.factory.annotation.Autowired
    private com.pitcherx.repository.CurtidaRepository curtidaRepository;
    @org.springframework.beans.factory.annotation.Autowired
    private com.pitcherx.repository.SenhaResetTokenRepository senhaResetTokenRepository;
    @org.springframework.beans.factory.annotation.Autowired
    private com.pitcherx.repository.ProjetoInteracaoRepository projetoInteracaoRepository;
    @org.springframework.beans.factory.annotation.Autowired
    private com.pitcherx.repository.EnderecoRepository enderecoRepository;


    /**
     * Dados pessoais (telefone, comprovante de identidade e tentativas) só para o próprio
     * usuário e o administrador. Antes, GET /usuario os expunha para qualquer conta.
     */
    private UsuarioResponseDTO paraLeitura(Usuario usuario) {
        UsuarioResponseDTO dto = usuarioMapper.toDTO(usuario);
        boolean podeVerTudo;
        try {
            podeVerTudo = permissoes.isAdmin() || java.util.Objects.equals(permissoes.idUsuarioAtual(), usuario.getIdUsuario());
        } catch (org.springframework.security.access.AccessDeniedException e) {
            podeVerTudo = false;
        }
        if (podeVerTudo) return dto;
        return new UsuarioResponseDTO(dto.idUsuario(), dto.nomeUsuario(), dto.emailUsuario(), null, dto.urlImagemUsuario(),
                dto.urlVideoUsuario(), null, dto.statusAnaliseIdentidade(), null, dto.active(), dto.roles(), dto.nivelConta());
    }

    @Transactional(readOnly = true)
    public UsuarioResponseDTO buscarUsuarioPorId(Long idUsuario) {
        Usuario usuario = usuarioRepository.findById(idUsuario).orElseThrow(() -> new EntityNotFoundException("Sem usuário com o ID informado!"));
        return paraLeitura(usuario);
    }

    @Transactional
    public UsuarioResponseDTO criarUsuario(UsuarioRequestDTO usuarioRequestDTO) {

        if (usuarioRepository.existsUsuarioByEmailUsuario(usuarioRequestDTO.emailUsuario())) {
            throw new IllegalArgumentException("Já existe um usuário com esse email!");
        }

        Role role = roleRepository.findRoleByNomeRole(RoleType.USUARIO)
                .orElseThrow(() -> new RuntimeException("Role com o nome informado não encontrada!"));

        NivelConta nivelIniciante = nivelContaRepository.findByNome(NivelConta.NivelContaNome.INICIANTE)
                .orElseThrow(() -> new RuntimeException("Nível INICIANTE não encontrado!"));

        Usuario usuario = usuarioMapper.toEntity(usuarioRequestDTO);
        String senhaHash = passwordEncoder.encode(usuarioRequestDTO.senhaUsuario());
        usuario.setSenhaUsuario(senhaHash);
        usuario.setRoles(Set.of(role));
        usuario.setNivelConta(nivelIniciante);

        String codigoVerificacao = gerarCodigoVerificacao();
        usuario.setCodigoVerificacao(codigoVerificacao);
        usuario.setVerificado(false);
        usuario.setActive(false);
        usuario.setStatusAnaliseIdentidade("PENDENTE");
        usuario.setTentativasIdentidade(0);

        Usuario salvo = usuarioRepository.save(usuario);
        enviarEmailSemInterromper("código de verificação",
                () -> emailService.enviarCodigoVerificacao(usuario.getEmailUsuario(), usuario.getNomeUsuario(), codigoVerificacao));
        return usuarioMapper.toDTO(salvo);
    }

    private String gerarCodigoVerificacao() {
        return String.format("%06d", new java.util.Random().nextInt(999999));
    }

    @Transactional
    public UsuarioResponseDTO atualizarUsuario(Long idUsuario, UsuarioRequestDTO usuarioRequestDTO) {
        Usuario usuario = usuarioRepository.findById(idUsuario).orElseThrow(() -> new EntityNotFoundException("Sem usuário com o ID informado!"));

        if (usuarioRepository.existsUsuarioByEmailUsuarioAndIdUsuarioNot(usuarioRequestDTO.emailUsuario(), idUsuario)) {
            throw new IllegalArgumentException("Já existe um usuário com esse email!");
        }

        // "senhaUsuario" confirma a identidade de quem edita (a troca de senha é feita em
        // PUT /usuario/redefinir-senha/{id}). Antes o valor enviado virava a nova senha sem
        // nenhuma conferência. O administrador editando outra conta não precisa da senha dela.
        boolean adminEditandoOutro = permissoes.isAdmin() && !java.util.Objects.equals(permissoes.idUsuarioAtual(), idUsuario);
        if (!adminEditandoOutro && !passwordEncoder.matches(usuarioRequestDTO.senhaUsuario(), usuario.getSenhaUsuario())) {
            throw new IllegalArgumentException("Senha atual incorreta. Confirme sua senha para salvar as alterações.");
        }
        usuarioMapper.updateFromDTO(usuarioRequestDTO, usuario);

        Usuario salvo = usuarioRepository.save(usuario);
        return usuarioMapper.toDTO(salvo);
    }

    @Transactional
    public UsuarioResponseDTO ativarDesativarUsuario(Long idUsuario) {
        Usuario usuario = usuarioRepository.findById(idUsuario).orElseThrow(() -> new EntityNotFoundException("Sem usuário com o ID informado!"));

        if (usuario.getActive()) {
            usuario.setActive(false);
        } else {
            usuario.setActive(true);
        }

        Usuario salvo = usuarioRepository.save(usuario);
        return usuarioMapper.toDTO(salvo);
    }

    /**
     * Confere o código da conta LOGADA. Antes a busca era pelo código no banco inteiro: qualquer
     * pessoa logada confirmava a conta de outra se acertasse o código dela, e dois cadastros com
     * o mesmo código (6 dígitos) faziam a busca devolver dois resultados e falhar.
     */
    @Transactional
    public UsuarioResponseDTO verificarConta(String codigoVerificacao) {
        Usuario usuario = usuarioRepository.findById(permissoes.idUsuarioAtual())
                .orElseThrow(() -> new EntityNotFoundException("Sem usuário com o ID informado!"));

        if (usuario.isVerificado()) {
            throw new IllegalArgumentException("Conta já foi verificada!");
        }
        String esperado = usuario.getCodigoVerificacao();
        if (esperado == null || codigoVerificacao == null || !esperado.equals(codigoVerificacao.trim())) {
            throw new IllegalArgumentException("Código de verificação inválido!");
        }

        usuario.setVerificado(true);
        usuario.setCodigoVerificacao(null);

        Usuario salvo = usuarioRepository.save(usuario);
        return usuarioMapper.toDTO(salvo);
    }

    /** Gera um novo código para a conta logada (ainda não verificada) e o envia por e-mail. */
    @Transactional
    public void reenviarCodigoVerificacao() {
        Usuario usuario = usuarioRepository.findById(permissoes.idUsuarioAtual())
                .orElseThrow(() -> new EntityNotFoundException("Sem usuário com o ID informado!"));
        if (usuario.isVerificado()) {
            throw new IllegalArgumentException("Conta já foi verificada!");
        }
        String codigo = gerarCodigoVerificacao();
        usuario.setCodigoVerificacao(codigo);
        usuarioRepository.save(usuario);
        try {
            emailService.enviarCodigoVerificacao(usuario.getEmailUsuario(), usuario.getNomeUsuario(), codigo);
        } catch (RuntimeException e) {
            LOG_EMAIL.error("Falha ao reenviar o código de verificação: {}", e.getMessage());
            throw new BusinessException("Não foi possível enviar o e-mail com o novo código agora. Tente novamente em alguns minutos.", "FALHA_ENVIO_EMAIL");
        }
    }

    @Transactional
    public void deletarUsuario(Long idUsuario) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new EntityNotFoundException("Sem usuário com o ID informado!"));
        if (projetoRepository.countByUsuarioCriadorId(idUsuario) > 0) {
            throw new BusinessException("Esta conta ainda é criadora de projetos. Exclua os projetos antes de excluir a conta.", "CONTA_COM_PROJETOS");
        }
        // Registros pessoais que só existem por causa da conta. Antes, a notificação de
        // "identidade aprovada" (que toda conta ativa recebe) impedia a exclusão: o erro só
        // surgia no commit e virava 500.
        notificacaoRepository.apagarDoUsuario(idUsuario);
        // Conversas privadas da conta (as mensagens primeiro, por causa da chave estrangeira).
        mensagemRepository.apagarDasConversasDoUsuario(idUsuario);
        conversaRepository.apagarDoUsuario(idUsuario);
        conexaoRepository.apagarDoUsuario(idUsuario);
        curtidaRepository.apagarDoUsuario(idUsuario);
        senhaResetTokenRepository.apagarDoUsuario(idUsuario);
        projetoInteracaoRepository.apagarDoUsuario(idUsuario);
        enderecoRepository.apagarDoUsuario(idUsuario);
        // O perfil profissional sai junto (cascade ALL em Usuario.perfilUsuario).
        try {
            usuarioRepository.delete(usuario);
            // Força o DELETE agora para que uma violação de chave estrangeira caia no catch.
            usuarioRepository.flush();
            uploadUtil.limparAposTransacaoImagens(
                    usuario.getUrlImagemUsuario() == null ? List.of() : List.of(usuario.getUrlImagemUsuario()),
                    List.of());
            uploadUtil.limparAposTransacaoVideos(
                    usuario.getUrlVideoUsuario() == null ? List.of() : List.of(usuario.getUrlVideoUsuario()),
                    List.of());
        } catch (org.springframework.dao.DataAccessException e) {
            // Conteúdo de negócio (publicações, comentários, projetos, propostas, contratos...)
            // não é apagado em silêncio: a pessoa precisa removê-lo antes.
            throw new BusinessException("Esta conta ainda tem publicações, comentários, projetos ou propostas. Exclua esse conteúdo antes de excluir a conta.", "CONTA_COM_CONTEUDO");
        }
    }

    @Transactional
    public LoginResponseDTO login(LoginRequestDTO loginRequestDTO) {
        Usuario usuario = usuarioRepository.findUserByEmailUsuario(loginRequestDTO.emailUsuario())
                .orElseThrow(() -> new EntityNotFoundException("Sem usuário com o email informado!"));

        if (!passwordEncoder.matches(loginRequestDTO.senhaUsuario(), usuario.getSenhaUsuario())) {
            throw new IllegalArgumentException("Credenciais incorretas!");
        }

        if (!usuario.getActive()) {
            throw new IllegalArgumentException("Sua conta ainda não foi ativada. Aguarde a aprovação da identidade pelo admin.");
        }

        UsernamePasswordAuthenticationToken authenticationToken =
                new UsernamePasswordAuthenticationToken(
                        usuario,
                        null,
                        usuario.getAuthorities()
                );

        SecurityContextHolder.getContext().setAuthentication(authenticationToken);

        String token = tokenConfig.generateToken(usuario);

        return new LoginResponseDTO(
                usuario.getIdUsuario(),
                usuario.getNomeUsuario(),
                usuario.getEmailUsuario(),
                usuario.getActive(),
                token,
                usuario.getRoles(),
                usuario.isVerificado()
        );
    }

    @Transactional
    public UsuarioResponseDTO redefinirSenha(Long idUsuario, RedefinirSenhaRequestDTO redefinirSenhaRequestDTO) {
        Usuario usuario = usuarioRepository.findById(idUsuario).orElseThrow(() -> new EntityNotFoundException("Sem usuário com o ID informado!"));

        if (!passwordEncoder.matches(redefinirSenhaRequestDTO.senhaAtual(), usuario.getSenhaUsuario())) {
            throw new IllegalArgumentException("A senha atual está incorreta!");
        }

        String novaSenhaHash = passwordEncoder.encode(redefinirSenhaRequestDTO.novaSenha());
        usuario.setSenhaUsuario(novaSenhaHash);

        Usuario salvo = usuarioRepository.save(usuario);
        return usuarioMapper.toDTO(salvo);
    }

    @Transactional
    public UsuarioResponseDTO alterarRole(Long idUsuario, Long idRole) {

        Usuario usuario = usuarioRepository.findById(idUsuario).
                orElseThrow(() -> new EntityNotFoundException("Sem usuário com o ID informado!"));

        com.pitcherx.model.Role role = roleRepository.findById(idRole).
                orElseThrow(() -> new EntityNotFoundException("Sem função com o ID informado!"));

        usuario.getRoles().add(role);

        Usuario salvo = usuarioRepository.save(usuario);
        return usuarioMapper.toDTO(salvo);
    }

    @Transactional
    public UsuarioResponseDTO atualizarFotoUsuario(Long idUsuario, MultipartFile arquivo) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new EntityNotFoundException("Sem usuário com o ID informado!"));

        String novaUrl = uploadUtil.salvarImagem(arquivo);
        uploadUtil.limparAposTransacaoImagens(
                usuario.getUrlImagemUsuario() == null ? List.of() : List.of(usuario.getUrlImagemUsuario()),
                List.of(novaUrl));
        usuario.setUrlImagemUsuario(novaUrl);

        Usuario salvo = usuarioRepository.save(usuario);
        return usuarioMapper.toDTO(salvo);
    }

    @Transactional
    public void removerFotoUsuario(Long idUsuario) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new EntityNotFoundException("Sem usuário com o ID informado!"));

        uploadUtil.limparAposTransacaoImagens(
                usuario.getUrlImagemUsuario() == null ? List.of() : List.of(usuario.getUrlImagemUsuario()),
                List.of());
        usuario.setUrlImagemUsuario(null);

        usuarioRepository.save(usuario);
    }

    /* ========================================================================
       NOVO: Verificação de identidade (comprovante)
       ======================================================================== */

    /**
     * Envio da foto de verificação por quem ainda não pode entrar (conta inativa aguardando
     * aprovação ou reprovada). A pessoa se identifica com e-mail e senha; a mensagem de erro é a
     * mesma para e-mail inexistente e senha errada.
     */
    @Transactional
    public UsuarioResponseDTO enviarComprovanteAntesDoLogin(String email, String senha, MultipartFile arquivo) {
        String emailNormalizado = email == null ? "" : email.trim();
        Usuario usuario = usuarioRepository.findUserByEmailUsuario(emailNormalizado)
                .filter(u -> senha != null && passwordEncoder.matches(senha, u.getSenhaUsuario()))
                .orElseThrow(() -> new IllegalArgumentException("E-mail ou senha incorretos."));

        if (Boolean.TRUE.equals(usuario.getActive())) {
            throw new BusinessException("Sua conta já está ativa. Entre na plataforma para ver a sua verificação.", "CONTA_JA_ATIVA");
        }
        return enviarComprovanteIdentidade(usuario.getIdUsuario(), arquivo);
    }

    @Transactional
    public UsuarioResponseDTO enviarComprovanteIdentidade(Long idUsuario, MultipartFile arquivo) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new EntityNotFoundException("Sem usuário com o ID informado!"));

        if ("APROVADA".equals(usuario.getStatusAnaliseIdentidade())) {
            throw new BusinessException("Sua identidade já foi aprovada.", "IDENTIDADE_JA_APROVADA");
        }
        if ("REPROVADA".equals(usuario.getStatusAnaliseIdentidade()) && usuario.getTentativasIdentidade() >= 5) {
            throw new BusinessException("Limite máximo de 5 tentativas de envio de comprovante excedido.", "LIMITE_TENTATIVAS_IDENTIDADE");
        }

        String novaUrl = uploadUtil.salvarImagem(arquivo);
        usuario.setUrlComprovanteIdentidade(novaUrl);
        usuario.setStatusAnaliseIdentidade("PENDENTE");
        usuario.setTentativasIdentidade((usuario.getTentativasIdentidade() == null ? 0 : usuario.getTentativasIdentidade()) + 1);

        Usuario salvo = usuarioRepository.save(usuario);

        notificarAdminsNovoComprovante(salvo);

        return usuarioMapper.toDTO(salvo);
    }

    @Transactional
    public UsuarioResponseDTO analisarIdentidade(Long idUsuario, AnaliseIdentidadeDTO dto, Usuario admin) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new EntityNotFoundException("Sem usuário com o ID informado!"));

        if (!"PENDENTE".equals(usuario.getStatusAnaliseIdentidade())) {
            throw new BusinessException("Identidade já foi analisada anteriormente.", "IDENTIDADE_JA_ANALISADA");
        }

        if ("APROVADA".equalsIgnoreCase(dto.status())) {
            usuario.setStatusAnaliseIdentidade("APROVADA");
            usuario.setActive(true);
            enviarEmailSemInterromper("identidade aprovada",
                    () -> emailService.enviarIdentidadeAprovada(usuario.getEmailUsuario(), usuario.getNomeUsuario()));
            criarNotificacao(usuario.getIdUsuario(),
                    "Identidade aprovada",
                    "Sua identidade foi aprovada e sua conta está ativa. Você já pode usar a PitcherX!",
                    "IDENTIDADE_APROVADA", usuario.getIdUsuario());
        } else if ("REPROVADA".equalsIgnoreCase(dto.status())) {
            if (dto.justificativa() == null || dto.justificativa().isBlank()) {
                throw new BusinessException("Justificativa é obrigatória para reprovação de identidade.", "JUSTIFICATIVA_OBRIGATORIA");
            }
            usuario.setStatusAnaliseIdentidade("REPROVADA");
            enviarEmailSemInterromper("identidade reprovada",
                    () -> emailService.enviarIdentidadeReprovada(usuario.getEmailUsuario(), usuario.getNomeUsuario(), dto.justificativa()));
            criarNotificacao(usuario.getIdUsuario(),
                    "Identidade reprovada",
                    "Sua identidade foi reprovada. Motivo: " + dto.justificativa() + ". Você pode reenviar o comprovante.",
                    "IDENTIDADE_REPROVADA", usuario.getIdUsuario());
        } else {
            throw new BusinessException("Status inválido. Use APROVADA ou REPROVADA.", "STATUS_INVALIDO");
        }

        Usuario salvo = usuarioRepository.save(usuario);
        return usuarioMapper.toDTO(salvo);
    }

    @Transactional(readOnly = true)
    public Page<UsuarioResponseDTO> listarPendentesIdentidade(Pageable pageable) {
        return usuarioRepository.findByStatusAnaliseIdentidade("PENDENTE", pageable)
                .map(usuarioMapper::toDTO);
    }

    @Transactional
    public UsuarioResponseDTO alterarNivelConta(Long idUsuario, Long nivelId, Usuario admin) {
        Usuario usuario = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new EntityNotFoundException("Sem usuário com o ID informado!"));

        NivelConta nivel = nivelContaRepository.findById(nivelId)
                .orElseThrow(() -> new EntityNotFoundException("Nível de conta não encontrado!"));

        usuario.setNivelConta(nivel);

        Usuario salvo = usuarioRepository.save(usuario);
        criarNotificacao(usuario.getIdUsuario(),
                "Nível de conta alterado",
                "Seu nível de conta foi alterado para: " + nivel.getNome().name(),
                "NIVEL_CONTA_ALTERADO", usuario.getIdUsuario());
        return usuarioMapper.toDTO(salvo);
    }

    /* ========================================================================
       NOVO: Cálculo automático de nível de conta
       ======================================================================== */

    @Transactional
    public void recalcularNivel(Usuario usuario) {
        Long usuarioId = usuario.getIdUsuario();
        NivelConta nivelAtual = usuario.getNivelConta();
        int ordemAtual = nivelAtual != null ? (nivelAtual.getOrdem() != null ? nivelAtual.getOrdem() : 0) : 0;

        int ordemAlvo = ordemAtual;

        // PROFISSIONAL: criou ao menos um projeto
        long projetosCriados = projetoRepository.countByUsuarioCriadorId(usuarioId);
        if (projetosCriados >= 1 && ordemAlvo < 3) {
            ordemAlvo = 3;
        }

        // ESPECIALISTA: criou projeto E é sócio/investidor em outros projetos
        boolean eSocioInvestidor = projetoUsuarioRepository.existsByUsuario_IdUsuarioAndTipoVinculo_NomeTipoVinculoIn(
                usuarioId, List.of("SOCIO", "INVESTIDOR"));
        if (projetosCriados >= 1 && eSocioInvestidor && ordemAlvo < 4) {
            ordemAlvo = 4;
        }

        // REFERENCIA: projeto próprio com 100+ visualizações e 100+ seguidores
        boolean referencia = projetoRepository.existsByUsuarioCriadorIdAndVisualizacoesGreaterThanEqualAndSeguidoresGreaterThanEqual(
                usuarioId, 100, 100);
        if (referencia && ordemAlvo < 5) {
            ordemAlvo = 5;
        }

        // ELITE: projeto próprio com 200+ visualizações e 200+ seguidores
        boolean elite = projetoRepository.existsByUsuarioCriadorIdAndVisualizacoesGreaterThanEqualAndSeguidoresGreaterThanEqual(
                usuarioId, 200, 200);
        if (elite && ordemAlvo < 6) {
            ordemAlvo = 6;
        }

        if (ordemAlvo > ordemAtual) {
            final int ordemFinal = ordemAlvo;
            NivelConta novoNivel = nivelContaRepository.findAllByOrderByOrdemAsc().stream()
                    .filter(n -> n.getOrdem() != null && n.getOrdem() == ordemFinal)
                    .findFirst()
                    .orElse(null);
            if (novoNivel != null) {
                usuario.setNivelConta(novoNivel);
                usuarioRepository.save(usuario);
                criarNotificacao(usuario.getIdUsuario(),
                        "Nível de conta evoluído",
                        "Parabéns! Seu nível de conta evoluiu para: " + novoNivel.getNome().name(),
                        "NIVEL_CONTA_EVOLUICAO", usuario.getIdUsuario());
            }
        }
    }

    private static final org.slf4j.Logger LOG_EMAIL = org.slf4j.LoggerFactory.getLogger(UsuarioService.class);

    /**
     * Falha no envio de e-mail (SMTP fora do ar, credenciais erradas) não pode desfazer o cadastro
     * ou a análise de identidade: antes, o erro virava 500 e a transação inteira era revertida.
     * A notificação dentro da plataforma continua sendo gravada.
     */
    private void enviarEmailSemInterromper(String descricao, Runnable envio) {
        try {
            envio.run();
        } catch (RuntimeException e) {
            LOG_EMAIL.error("Falha ao enviar e-mail ({}): {}", descricao, e.getMessage());
        }
    }

    private void criarNotificacao(Long usuarioId, String titulo, String mensagem, String tipo, Long referenciaId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new BusinessException("Usuário não encontrado para notificação.", "USER_NOT_FOUND"));
        Notificacao notificacao = new Notificacao();
        notificacao.setUsuario(usuario);
        notificacao.setTitulo(titulo);
        notificacao.setMensagem(mensagem);
        notificacao.setTipo(tipo);
        notificacao.setReferenciaId(referenciaId);
        notificacaoRepository.save(notificacao);
    }

    private void notificarAdminsNovoComprovante(Usuario usuario) {
        List<Usuario> admins = usuarioRepository.findByRoles_NomeRole(RoleType.ADMIN);
        String mensagem = String.format("Novo comprovante de identidade pendente para o usuário %s (ID: %d)",
                usuario.getNomeUsuario(), usuario.getIdUsuario());
        for (Usuario admin : admins) {
            criarNotificacao(admin.getIdUsuario(),
                    "Novo comprovante de identidade",
                    mensagem,
                    "COMPROVANTE_IDENTIDADE_NOVO", usuario.getIdUsuario());
            enviarEmailSemInterromper("aviso de novo comprovante ao admin",
                    () -> emailService.enviarAceiteTermoVinculo(admin.getEmailUsuario(), admin.getNomeUsuario(), null, mensagem));
        }
    }
}
