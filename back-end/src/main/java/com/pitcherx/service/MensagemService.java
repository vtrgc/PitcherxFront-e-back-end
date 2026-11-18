package com.pitcherx.service;

import com.pitcherx.dto.mensagem.*;
import com.pitcherx.exceptions.BusinessException;
import com.pitcherx.model.Conversa;
import com.pitcherx.model.Mensagem;
import com.pitcherx.model.Usuario;
import com.pitcherx.repository.ConexaoRepository;
import com.pitcherx.repository.ConversaRepository;
import com.pitcherx.repository.MensagemRepository;
import com.pitcherx.repository.UsuarioRepository;
import com.pitcherx.security.Permissoes;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Mensagens privadas.
 *
 * Regras:
 *  - quem envia é sempre o usuário do token;
 *  - só envia (e edita) quem tem conexão ACEITA com a outra pessoa, verificada a cada envio;
 *  - só os dois participantes leem a conversa (nem o administrador);
 *  - sem conexão, o histórico continua visível para os dois, mas não aceita mensagens novas.
 */
@Service
public class MensagemService {

    public static final int TAMANHO_MAXIMO = 2000;
    static final int LIMITE_PADRAO = 50;
    static final int LIMITE_MAXIMO = 200;
    /** Prazo para editar uma mensagem enviada. */
    static final Duration PRAZO_EDICAO = Duration.ofMinutes(15);
    /**
     * O cursor da atualização incremental volta alguns segundos: uma mensagem gravada por outra
     * transação durante a consulta ainda aparece na próxima (o front junta tudo pelo id).
     */
    static final Duration SOBREPOSICAO_CURSOR = Duration.ofSeconds(5);

    private final ConversaRepository conversaRepository;
    private final MensagemRepository mensagemRepository;
    private final ConexaoRepository conexaoRepository;
    private final UsuarioRepository usuarioRepository;
    private final Permissoes permissoes;

    public MensagemService(ConversaRepository conversaRepository,
                           MensagemRepository mensagemRepository,
                           ConexaoRepository conexaoRepository,
                           UsuarioRepository usuarioRepository,
                           Permissoes permissoes) {
        this.conversaRepository = conversaRepository;
        this.mensagemRepository = mensagemRepository;
        this.conexaoRepository = conexaoRepository;
        this.usuarioRepository = usuarioRepository;
        this.permissoes = permissoes;
    }

    /** Resultado do envio: {@code criada} é false quando a chave do cliente já tinha sido usada. */
    public record ResultadoEnvio(MensagemResponseDTO mensagem, boolean criada) {
    }

    // ------------------------------------------------------------------ consultas

    @Transactional(readOnly = true)
    public List<ConversaResponseDTO> listarConversas() {
        Long eu = permissoes.idUsuarioAtual();
        List<Conversa> conversas = conversaRepository.listarDoUsuario(eu);
        if (conversas.isEmpty()) return List.of();

        List<Long> ids = conversas.stream().map(Conversa::getIdConversa).toList();
        Map<Long, Mensagem> ultimas = mensagemRepository.ultimasDasConversas(ids).stream()
                .collect(Collectors.toMap(m -> m.getConversa().getIdConversa(), m -> m));
        Map<Long, Long> naoLidas = new HashMap<>();
        for (Object[] linha : mensagemRepository.naoLidasPorConversa(ids, eu)) {
            naoLidas.put((Long) linha[0], (Long) linha[1]);
        }
        List<SituacaoConexaoMensagem.Vinculo> vinculos = conexaoRepository.vinculosDoUsuario(eu).stream()
                .map(SituacaoConexaoMensagem.Vinculo::de).toList();

        return conversas.stream()
                .map(c -> paraDTO(c, eu, ultimas.get(c.getIdConversa()), naoLidas.getOrDefault(c.getIdConversa(), 0L), vinculos))
                .toList();
    }

    @Transactional(readOnly = true)
    public ConversaResponseDTO buscarConversa(Long conversaId) {
        Long eu = permissoes.idUsuarioAtual();
        Conversa conversa = exigirParticipante(conversaId, eu);
        Long outroId = conversa.outroParticipante(eu).getIdUsuario();
        Mensagem ultima = mensagemRepository.ultimas(conversaId, PageRequest.of(0, 1)).stream().findFirst().orElse(null);
        long naoLidas = mensagemRepository.naoLidasPorConversa(List.of(conversaId), eu).stream()
                .mapToLong(l -> (Long) l[1]).sum();
        return paraDTO(conversa, eu, ultima, naoLidas, vinculosEntre(eu, outroId));
    }

    /**
     * Histórico em ordem de envio.
     *  - sem parâmetros: as últimas {@code limite} mensagens;
     *  - {@code antesDe}: as anteriores a uma mensagem (rolar para cima);
     *  - {@code desde}: o que foi criado, lido, editado ou excluído a partir do cursor anterior.
     */
    @Transactional(readOnly = true)
    public HistoricoMensagensDTO historico(Long conversaId, Long antesDe, Instant desde, Integer limite) {
        Long eu = permissoes.idUsuarioAtual();
        exigirParticipante(conversaId, eu);
        Instant cursor = Instant.now().minus(SOBREPOSICAO_CURSOR);

        List<Mensagem> mensagens;
        boolean temMais;
        if (desde != null) {
            mensagens = new ArrayList<>(mensagemRepository.alteradasDesde(conversaId, desde, PageRequest.of(0, LIMITE_MAXIMO + 1)));
            temMais = mensagens.size() > LIMITE_MAXIMO;
            if (temMais) mensagens = mensagens.subList(0, LIMITE_MAXIMO);
        } else {
            int tamanho = limite == null ? LIMITE_PADRAO : Math.max(1, Math.min(limite, LIMITE_MAXIMO));
            PageRequest pagina = PageRequest.of(0, tamanho + 1);
            mensagens = new ArrayList<>(antesDe == null
                    ? mensagemRepository.ultimas(conversaId, pagina)
                    : mensagemRepository.anteriores(conversaId, antesDe, pagina));
            temMais = mensagens.size() > tamanho;
            if (temMais) mensagens = new ArrayList<>(mensagens.subList(0, tamanho));
            Collections.reverse(mensagens);
        }
        return new HistoricoMensagensDTO(mensagens.stream().map(m -> paraDTO(m, eu)).toList(), temMais, cursor);
    }

    @Transactional(readOnly = true)
    public long contarNaoLidas() {
        return mensagemRepository.contarNaoLidas(permissoes.idUsuarioAtual());
    }

    /** Se o usuário logado pode conversar com {@code usuarioId} (botão "Enviar mensagem" do perfil). */
    @Transactional(readOnly = true)
    public PermissaoMensagemDTO permissao(Long usuarioId) {
        Long eu = permissoes.idUsuarioAtual();
        Usuario outro = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado."));
        SituacaoConexaoMensagem situacao = situacaoCom(eu, outro);
        Long conversaId = Objects.equals(eu, usuarioId) ? null
                : conversaRepository.buscarEntre(eu, usuarioId).map(Conversa::getIdConversa).orElse(null);
        return new PermissaoMensagemDTO(participante(outro), situacao.podeEnviar(), situacao.name(), situacao.motivo(), conversaId);
    }

    // ------------------------------------------------------------------ alterações

    @Transactional
    public ResultadoEnvio enviar(MensagemRequestDTO dto) {
        Long eu = permissoes.idUsuarioAtual();
        String conteudo = conteudoValido(dto.conteudo());
        String chave = dto.chaveCliente() == null || dto.chaveCliente().isBlank() ? null : dto.chaveCliente().trim();

        // Reenvio de uma tentativa que já chegou ao servidor (ex.: a resposta se perdeu na rede).
        if (chave != null) {
            Optional<Mensagem> existente = mensagemRepository.findByRemetente_IdUsuarioAndChaveCliente(eu, chave);
            if (existente.isPresent()) {
                Mensagem m = existente.get();
                if (!m.getConversa().temParticipante(dto.destinatarioId())) {
                    throw new BusinessException("Esta chave de envio já foi usada em outra conversa.", "CHAVE_ENVIO_REPETIDA");
                }
                return new ResultadoEnvio(paraDTO(m, eu), false);
            }
        }

        if (Objects.equals(eu, dto.destinatarioId())) {
            throw new BusinessException(SituacaoConexaoMensagem.MESMO_USUARIO.motivo(), "MENSAGEM_PARA_SI");
        }
        Usuario remetente = usuarioRepository.findById(eu)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado."));
        Usuario destinatario = usuarioRepository.findById(dto.destinatarioId())
                .orElseThrow(() -> new EntityNotFoundException("Destinatário não encontrado."));
        exigirConexao(eu, destinatario);

        Conversa conversa = conversaRepository.buscarEntre(eu, destinatario.getIdUsuario())
                .orElseGet(() -> conversaRepository.saveAndFlush(Conversa.entre(remetente, destinatario)));

        Instant agora = Instant.now();
        Mensagem mensagem = new Mensagem();
        mensagem.setConversa(conversa);
        mensagem.setRemetente(remetente);
        mensagem.setConteudo(conteudo);
        mensagem.setDataEnvio(agora);
        mensagem.setDataAtualizacao(agora);
        mensagem.setChaveCliente(chave);
        mensagem = mensagemRepository.saveAndFlush(mensagem);

        conversa.setDataUltimaMensagem(agora);
        conversaRepository.save(conversa);
        return new ResultadoEnvio(paraDTO(mensagem, eu), true);
    }

    /** Usado quando dois envios com a mesma chave chegam juntos e um deles perde a corrida. */
    @Transactional(readOnly = true)
    public Optional<MensagemResponseDTO> buscarPorChave(String chaveCliente) {
        if (chaveCliente == null || chaveCliente.isBlank()) return Optional.empty();
        Long eu = permissoes.idUsuarioAtual();
        return mensagemRepository.findByRemetente_IdUsuarioAndChaveCliente(eu, chaveCliente.trim()).map(m -> paraDTO(m, eu));
    }

    /** Marca como lidas as mensagens recebidas na conversa. Devolve quantas mudaram. */
    @Transactional
    public int marcarComoLidas(Long conversaId) {
        Long eu = permissoes.idUsuarioAtual();
        exigirParticipante(conversaId, eu);
        return mensagemRepository.marcarComoLidas(conversaId, eu, Instant.now());
    }

    @Transactional
    public MensagemResponseDTO editar(Long mensagemId, MensagemEdicaoRequestDTO dto) {
        Long eu = permissoes.idUsuarioAtual();
        Mensagem mensagem = exigirAutor(mensagemId, eu, "editar");
        if (mensagem.isExcluida()) {
            throw new BusinessException("Esta mensagem foi apagada.", "MENSAGEM_EXCLUIDA");
        }
        if (Instant.now().isAfter(mensagem.getDataEnvio().plus(PRAZO_EDICAO))) {
            throw new BusinessException("Só é possível editar uma mensagem até " + PRAZO_EDICAO.toMinutes()
                    + " minutos depois do envio.", "PRAZO_EDICAO_ENCERRADO");
        }
        exigirConexao(eu, mensagem.getConversa().outroParticipante(eu));

        String conteudo = conteudoValido(dto.conteudo());
        if (!conteudo.equals(mensagem.getConteudo())) {
            Instant agora = Instant.now();
            mensagem.setConteudo(conteudo);
            mensagem.setDataEdicao(agora);
            mensagem.setDataAtualizacao(agora);
            mensagemRepository.save(mensagem);
        }
        return paraDTO(mensagem, eu);
    }

    /** Exclusão lógica: some o texto para os dois participantes e fica o aviso "mensagem apagada". */
    @Transactional
    public void excluir(Long mensagemId) {
        Long eu = permissoes.idUsuarioAtual();
        Mensagem mensagem = exigirAutor(mensagemId, eu, "apagar");
        if (mensagem.isExcluida()) return;
        mensagem.setExcluida(true);
        mensagem.setConteudo("");
        mensagem.setDataAtualizacao(Instant.now());
        mensagemRepository.save(mensagem);
    }

    // ------------------------------------------------------------------ regras

    private Conversa exigirParticipante(Long conversaId, Long eu) {
        Conversa conversa = conversaRepository.findById(conversaId)
                .orElseThrow(() -> new EntityNotFoundException("Conversa não encontrada."));
        if (!conversa.temParticipante(eu)) {
            throw new AccessDeniedException("Você não participa desta conversa.");
        }
        return conversa;
    }

    private Mensagem exigirAutor(Long mensagemId, Long eu, String acao) {
        Mensagem mensagem = mensagemRepository.findById(mensagemId)
                .orElseThrow(() -> new EntityNotFoundException("Mensagem não encontrada."));
        if (!mensagem.getConversa().temParticipante(eu)) {
            throw new AccessDeniedException("Você não participa desta conversa.");
        }
        if (!Objects.equals(mensagem.getRemetente().getIdUsuario(), eu)) {
            throw new AccessDeniedException("Só quem enviou a mensagem pode " + acao + ".");
        }
        return mensagem;
    }

    /** A regra central: sem conexão aceita (verificada agora, no banco), nada é enviado. */
    private void exigirConexao(Long eu, Usuario outro) {
        SituacaoConexaoMensagem situacao = situacaoCom(eu, outro);
        if (!situacao.podeEnviar()) {
            throw new AccessDeniedException(situacao.motivo());
        }
    }

    private SituacaoConexaoMensagem situacaoCom(Long eu, Usuario outro) {
        return SituacaoConexaoMensagem.avaliar(eu, outro.getIdUsuario(), Boolean.TRUE.equals(outro.getActive()),
                vinculosEntre(eu, outro.getIdUsuario()));
    }

    private List<SituacaoConexaoMensagem.Vinculo> vinculosEntre(Long eu, Long outroId) {
        return conexaoRepository.vinculosEntre(eu, outroId).stream().map(SituacaoConexaoMensagem.Vinculo::de).toList();
    }

    private static String conteudoValido(String bruto) {
        String conteudo = bruto == null ? "" : bruto.strip();
        if (conteudo.isEmpty()) {
            throw new BusinessException("A mensagem não pode ficar vazia.", "MENSAGEM_VAZIA");
        }
        if (conteudo.length() > TAMANHO_MAXIMO) {
            throw new BusinessException("A mensagem pode ter no máximo " + TAMANHO_MAXIMO + " caracteres.", "MENSAGEM_LONGA");
        }
        return conteudo;
    }

    // ------------------------------------------------------------------ conversão

    private ConversaResponseDTO paraDTO(Conversa conversa, Long eu, Mensagem ultima, long naoLidas,
                                        List<SituacaoConexaoMensagem.Vinculo> vinculos) {
        Usuario outro = conversa.outroParticipante(eu);
        SituacaoConexaoMensagem situacao = SituacaoConexaoMensagem.avaliar(eu, outro.getIdUsuario(),
                Boolean.TRUE.equals(outro.getActive()), vinculos);
        return new ConversaResponseDTO(
                conversa.getIdConversa(),
                participante(outro),
                ultima == null ? null : paraDTO(ultima, eu),
                naoLidas,
                situacao.podeEnviar(),
                situacao.name(),
                situacao.motivo(),
                conversa.getDataUltimaMensagem());
    }

    private static MensagemResponseDTO paraDTO(Mensagem m, Long eu) {
        Long remetenteId = m.getRemetente().getIdUsuario();
        return new MensagemResponseDTO(
                m.getIdMensagem(),
                m.getConversa().getIdConversa(),
                remetenteId,
                m.isExcluida() ? null : m.getConteudo(),
                m.getDataEnvio(),
                m.isLida(),
                m.getDataLeitura(),
                m.getDataEdicao(),
                m.isExcluida(),
                Objects.equals(remetenteId, eu));
    }

    private static ParticipanteConversaDTO participante(Usuario u) {
        return new ParticipanteConversaDTO(u.getIdUsuario(), u.getNomeUsuario(), u.getUrlImagemUsuario());
    }
}
