package com.pitcherx.service;

import com.pitcherx.dto.conexao.ConexaoResponseDTO;
import com.pitcherx.dto.conexao.ConexaoSimplesDTO;
import com.pitcherx.dto.conexao.StatusConexaoDTO;
import com.pitcherx.dto.notificacao.NotificacaoResponseDTO;
import com.pitcherx.mapper.ConexaoMapper;
import com.pitcherx.mapper.NotificacaoMapper;
import com.pitcherx.model.Conexao;
import com.pitcherx.model.Notificacao;
import com.pitcherx.model.StatusConexao;
import com.pitcherx.model.Usuario;
import com.pitcherx.repository.ConexaoRepository;
import com.pitcherx.repository.NotificacaoRepository;
import com.pitcherx.repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ConexaoService {

    private final ConexaoRepository conexaoRepository;
    private final UsuarioRepository usuarioRepository;
    private final NotificacaoRepository notificacaoRepository;
    private final ConexaoMapper conexaoMapper;
    private final NotificacaoMapper notificacaoMapper;

    public ConexaoService(ConexaoRepository conexaoRepository,
                          UsuarioRepository usuarioRepository,
                          NotificacaoRepository notificacaoRepository,
                          ConexaoMapper conexaoMapper,
                          NotificacaoMapper notificacaoMapper) {
        this.conexaoRepository = conexaoRepository;
        this.usuarioRepository = usuarioRepository;
        this.notificacaoRepository = notificacaoRepository;
        this.conexaoMapper = conexaoMapper;
        this.notificacaoMapper = notificacaoMapper;
    }

    @Transactional
    public ConexaoResponseDTO solicitarConexao(Long seguidorId, Long seguidoId) {
        if (seguidorId.equals(seguidoId)) {
            throw new IllegalArgumentException("Não é possível conectar com você mesmo.");
        }

        Usuario seguidor = usuarioRepository.findById(seguidorId)
                .orElseThrow(() -> new EntityNotFoundException("Seguidor não encontrado."));
        Usuario seguido = usuarioRepository.findById(seguidoId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário a ser seguido não encontrado."));

        if (conexaoRepository.existsBySeguidor_IdUsuarioAndSeguido_IdUsuarioAndStatusIn(seguidorId, seguidoId,
                List.of(StatusConexao.PENDENTE, StatusConexao.ACEITO))) {
            throw new IllegalStateException("Já existe uma conexão ou solicitação pendente com este usuário.");
        }

        Conexao conexao = conexaoRepository.findBySeguidor_IdUsuarioAndSeguido_IdUsuario(seguidorId, seguidoId)
                .orElseGet(Conexao::new);
        conexao.setSeguidor(seguidor);
        conexao.setSeguido(seguido);
        conexao.setStatus(StatusConexao.PENDENTE);
        conexao.setDataSolicitacao(LocalDateTime.now());
        conexao.setDataResposta(null);

        Conexao salva = conexaoRepository.save(conexao);

        criarNotificacao(seguidoId,
                "Nova solicitação de conexão",
                seguidor.getNomeUsuario() + " quer se conectar com você.",
                "CONEXAO_SOLICITADA",
                salva.getIdConexao());

        return conexaoMapper.toDTO(salva);
    }

    @Transactional
    public ConexaoResponseDTO aceitarConexao(Long conexaoId, Long usuarioLogadoId) {
        Conexao conexao = conexaoRepository.findById(conexaoId)
                .orElseThrow(() -> new EntityNotFoundException("Conexão não encontrada."));

        if (!conexao.getSeguido().getIdUsuario().equals(usuarioLogadoId)) {
            throw new SecurityException("Você não tem permissão para aceitar esta solicitação.");
        }

        if (conexao.getStatus() != StatusConexao.PENDENTE) {
            throw new IllegalStateException("Esta solicitação já foi processada.");
        }

        conexao.setStatus(StatusConexao.ACEITO);
        conexao.setDataResposta(LocalDateTime.now());

        Conexao salva = conexaoRepository.save(conexao);

        criarNotificacao(conexao.getSeguidor().getIdUsuario(),
                "Conexão aceita",
                conexao.getSeguido().getNomeUsuario() + " aceitou sua solicitação de conexão.",
                "CONEXAO_ACEITA",
                salva.getIdConexao());

        return conexaoMapper.toDTO(salva);
    }

    @Transactional
    public ConexaoResponseDTO recusarConexao(Long conexaoId, Long usuarioLogadoId) {
        Conexao conexao = conexaoRepository.findById(conexaoId)
                .orElseThrow(() -> new EntityNotFoundException("Conexão não encontrada."));

        if (!conexao.getSeguido().getIdUsuario().equals(usuarioLogadoId)) {
            throw new SecurityException("Você não tem permissão para recusar esta solicitação.");
        }

        if (conexao.getStatus() != StatusConexao.PENDENTE) {
            throw new IllegalStateException("Esta solicitação já foi processada.");
        }

        conexao.setStatus(StatusConexao.RECUSADO);
        conexao.setDataResposta(LocalDateTime.now());

        Conexao salva = conexaoRepository.save(conexao);

        criarNotificacao(conexao.getSeguidor().getIdUsuario(),
                "Conexão recusada",
                conexao.getSeguido().getNomeUsuario() + " recusou sua solicitação de conexão.",
                "CONEXAO_RECUSADA",
                salva.getIdConexao());

        return conexaoMapper.toDTO(salva);
    }

    @Transactional
    public void removerConexao(Long conexaoId, Long usuarioLogadoId) {
        Conexao conexao = conexaoRepository.findById(conexaoId)
                .orElseThrow(() -> new EntityNotFoundException("Conexão não encontrada."));

        boolean isSeguidor = conexao.getSeguidor().getIdUsuario().equals(usuarioLogadoId);
        boolean isSeguido = conexao.getSeguido().getIdUsuario().equals(usuarioLogadoId);

        if (!isSeguidor && !isSeguido) {
            throw new SecurityException("Você não tem permissão para remover esta conexão.");
        }

        conexaoRepository.delete(conexao);
    }

    @Transactional
    public Page<ConexaoSimplesDTO> listarSeguidores(Long usuarioId, Pageable pageable) {
        usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado."));

        return conexaoRepository.findBySeguido_IdUsuarioAndStatus(usuarioId, StatusConexao.ACEITO, pageable)
                .map(conexaoMapper::toSeguidorSimplesDTO);
    }

    @Transactional
    public Page<ConexaoSimplesDTO> listarSeguindo(Long usuarioId, Pageable pageable) {
        usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado."));

        return conexaoRepository.findBySeguidor_IdUsuarioAndStatus(usuarioId, StatusConexao.ACEITO, pageable)
                .map(conexaoMapper::toSeguidoSimplesDTO);
    }

    @Transactional
    public Page<ConexaoSimplesDTO> listarSolicitacoesPendentes(Long usuarioId, Pageable pageable) {
        usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado."));

        return conexaoRepository.findBySeguido_IdUsuarioAndStatus(usuarioId, StatusConexao.PENDENTE, pageable)
                .map(conexaoMapper::toSeguidorSimplesDTO);
    }

    @Transactional
    public Page<ConexaoSimplesDTO> listarSolicitacoesEnviadas(Long usuarioId, Pageable pageable) {
        usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado."));

        return conexaoRepository.findBySeguidorIdAndStatusCustom(usuarioId, StatusConexao.PENDENTE, pageable)
                .map(conexaoMapper::toSeguidoSimplesDTO);
    }

    public long contarSeguidores(Long usuarioId) {
        return conexaoRepository.countBySeguido_IdUsuarioAndStatus(usuarioId, StatusConexao.ACEITO);
    }

    public long contarSeguindo(Long usuarioId) {
        return conexaoRepository.countBySeguidor_IdUsuarioAndStatus(usuarioId, StatusConexao.ACEITO);
    }

    public long contarSolicitacoesPendentes(Long usuarioId) {
        return conexaoRepository.countBySeguido_IdUsuarioAndStatus(usuarioId, StatusConexao.PENDENTE);
    }

    public StatusConexaoDTO verificarStatus(Long usuarioId, Long outroUsuarioId) {
        if (usuarioId.equals(outroUsuarioId)) {
            return new StatusConexaoDTO(null, false, false);
        }

        var conexaoOpt = conexaoRepository.findBySeguidor_IdUsuarioAndSeguido_IdUsuario(usuarioId, outroUsuarioId);
        var conexaoInversaOpt = conexaoRepository.findBySeguidor_IdUsuarioAndSeguido_IdUsuario(outroUsuarioId, usuarioId);

        boolean isSeguidor = conexaoOpt.isPresent() && conexaoOpt.get().getStatus() == StatusConexao.ACEITO;
        boolean isSeguido = conexaoInversaOpt.isPresent() && conexaoInversaOpt.get().getStatus() == StatusConexao.ACEITO;

        StatusConexao status = null;
        if (conexaoOpt.isPresent()) {
            status = conexaoOpt.get().getStatus();
        } else if (conexaoInversaOpt.isPresent()) {
            status = conexaoInversaOpt.get().getStatus();
        }

        return new StatusConexaoDTO(status, isSeguidor, isSeguido);
    }

    private void criarNotificacao(Long usuarioId, String titulo, String mensagem, String tipo, Long referenciaId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado para notificação."));

        Notificacao notificacao = new Notificacao();
        notificacao.setUsuario(usuario);
        notificacao.setTitulo(titulo);
        notificacao.setMensagem(mensagem);
        notificacao.setTipo(tipo);
        notificacao.setReferenciaId(referenciaId);

        notificacaoRepository.save(notificacao);
    }

    public Page<NotificacaoResponseDTO> listarNotificacoes(Long usuarioId, Pageable pageable) {
        return notificacaoRepository.findByUsuarioIdOrderByDataCriacaoDesc(usuarioId, pageable)
                .map(notificacaoMapper::toDTO);
    }

    public long contarNaoLidas(Long usuarioId) {
        return notificacaoRepository.countByUsuarioIdAndLidaFalse(usuarioId);
    }

    @Transactional
    public void marcarComoLida(Long notificacaoId, Long usuarioId) {
        Notificacao notificacao = notificacaoRepository.findById(notificacaoId)
                .orElseThrow(() -> new EntityNotFoundException("Notificação não encontrada."));

        if (!notificacao.getUsuario().getIdUsuario().equals(usuarioId)) {
            throw new SecurityException("Você não tem permissão para marcar esta notificação.");
        }

        notificacao.setLida(true);
        notificacaoRepository.save(notificacao);
    }

    @Transactional
    public void marcarTodasComoLidas(Long usuarioId) {
        List<Notificacao> naoLidas = notificacaoRepository.findByUsuarioIdAndLidaFalseOrderByDataCriacaoDesc(usuarioId);
        naoLidas.forEach(n -> n.setLida(true));
        notificacaoRepository.saveAll(naoLidas);
    }
}