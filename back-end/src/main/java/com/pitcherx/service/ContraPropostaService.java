package com.pitcherx.service;

import com.pitcherx.dto.contraProposta.ContraPropostaDecisionDTO;
import com.pitcherx.dto.contraProposta.ContraPropostaRequestDTO;
import com.pitcherx.dto.contraProposta.ContraPropostaResponseDTO;
import com.pitcherx.exceptions.BusinessException;
import com.pitcherx.mapper.ContraPropostaMapper;
import com.pitcherx.model.ContraProposta;
import com.pitcherx.model.Notificacao;
import com.pitcherx.model.Projeto;
import com.pitcherx.model.Proposta;
import com.pitcherx.model.Usuario;
import com.pitcherx.repository.ContraPropostaRepository;
import com.pitcherx.repository.NotificacaoRepository;
import com.pitcherx.repository.ProjetoRepository;
import com.pitcherx.repository.PropostaRepository;
import com.pitcherx.repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ContraPropostaService {

    private final ContraPropostaRepository contraPropostaRepository;
    private final ContraPropostaMapper contraPropostaMapper;
    private final PropostaRepository propostaRepository;
    private final ProjetoRepository projetoRepository;
    private final UsuarioRepository usuarioRepository;
    private final NotificacaoRepository notificacaoRepository;

    @Transactional(readOnly = true)
    public List<ContraPropostaResponseDTO> listarContraPropostas() {
        return contraPropostaRepository.findAll().stream()
                .map(contraPropostaMapper::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public ContraPropostaResponseDTO buscarContraPropostaPorId(Long idContraProposta) {
        ContraProposta contraProposta = contraPropostaRepository.findById(idContraProposta)
                .orElseThrow(() -> new EntityNotFoundException("Sem contra proposta com o ID informado."));
        return contraPropostaMapper.toDTO(contraProposta);
    }

    @Transactional(readOnly = true)
    public List<ContraPropostaResponseDTO> listarContraPropostasPorProjeto(Long projetoId) {
        return contraPropostaRepository.findAll().stream()
                .filter(cp -> cp.getProposta().getProjeto().getIdProjeto().equals(projetoId))
                .map(contraPropostaMapper::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ContraPropostaResponseDTO> listarMinhasContraPropostasCriadas(Long usuarioId) {
        return contraPropostaRepository.findByUsuario_IdUsuario(usuarioId).stream()
                .map(contraPropostaMapper::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ContraPropostaResponseDTO> listarContraPropostasRecebidas(Long usuarioId) {
        return contraPropostaRepository.findAll().stream()
                .filter(cp -> cp.getProposta().getUsuario().getIdUsuario().equals(usuarioId))
                .map(contraPropostaMapper::toDTO)
                .toList();
    }

    @Transactional
    public ContraPropostaResponseDTO criarContraProposta(ContraPropostaRequestDTO requestDTO, Usuario usuarioLogado) {
        Proposta proposta = propostaRepository.findById(requestDTO.idProposta())
                .orElseThrow(() -> new EntityNotFoundException("Sem proposta com o ID informado"));

        Projeto projeto = proposta.getProjeto();

        // Somente o proprietário do projeto pode criar contraproposta
        if (projeto.getUsuarioCriador() == null || !projeto.getUsuarioCriador().getIdUsuario().equals(usuarioLogado.getIdUsuario())) {
            throw new BusinessException("Apenas o proprietário do projeto pode criar contrapropostas.", "NAO_E_PROPRIETARIO_PROJETO");
        }
        if (!"PENDENTE".equals(proposta.getStatusProposta())) {
            throw new BusinessException("Esta proposta já foi decidida e não aceita contrapropostas.", "PROPOSTA_JA_DECIDIDA");
        }
        // Uma negociação por vez: não deixa duas contrapropostas aguardando resposta.
        if (contraPropostaRepository.existsByProposta_IdPropostaAndStatus(proposta.getIdProposta(), ContraProposta.StatusContraProposta.PENDENTE)) {
            throw new BusinessException("Já existe uma contraproposta aguardando resposta para esta proposta.", "CONTRAPROPOSTA_PENDENTE");
        }

        ContraProposta contraProposta = contraPropostaMapper.toEntity(requestDTO);
        contraProposta.setProposta(proposta);
        contraProposta.setUsuario(usuarioLogado);
        contraProposta.setStatus(ContraProposta.StatusContraProposta.PENDENTE);

        ContraProposta salvo = contraPropostaRepository.save(contraProposta);

        // Notificar o dono da proposta original
        Usuario donoProposta = proposta.getUsuario();
        criarNotificacao(donoProposta.getIdUsuario(),
                "Nova contraproposta recebida",
                "O proprietário do projeto enviou uma contraproposta para sua proposta #" + proposta.getIdProposta(),
                "CONTRAPROPOSTA_RECEBIDA", salvo.getIdContraProposta());

        return contraPropostaMapper.toDTO(salvo);
    }

    @Transactional
    public ContraPropostaResponseDTO aceitarContraProposta(Long idContraProposta, ContraPropostaDecisionDTO decisionDTO, Usuario usuarioLogado) {
        ContraProposta contraProposta = contraPropostaRepository.findById(idContraProposta)
                .orElseThrow(() -> new EntityNotFoundException("Sem contra proposta com o ID informado."));

        // Somente o dono da proposta original pode aceitar/rejeitar
        if (!contraProposta.getProposta().getUsuario().getIdUsuario().equals(usuarioLogado.getIdUsuario())) {
            throw new BusinessException("Apenas o dono da proposta original pode decidir sobre a contraproposta.", "NAO_E_DONO_PROPOSTA");
        }

        if (contraProposta.getStatus() != ContraProposta.StatusContraProposta.PENDENTE) {
            throw new BusinessException("Esta contraproposta já foi decidida.", "CONTRAPROPOSTA_JA_DECIDIDA");
        }

        if (!"ACEITA".equalsIgnoreCase(decisionDTO.status())) {
            throw new BusinessException("Para aceitar, o status deve ser ACEITA.", "STATUS_INVALIDO");
        }

        contraProposta.setStatus(ContraProposta.StatusContraProposta.ACEITA);
        contraProposta.setDataDecisao(LocalDateTime.now());
        contraProposta.setJustificativaDecisao(decisionDTO.justificativa());

        ContraProposta salvo = contraPropostaRepository.save(contraProposta);
        // Os termos acordados passam a valer na proposta: é o valor dela que entra no
        // arrecadado quando o criador fizer o aceite final.
        if (contraProposta.getValorContraProposta() != null) {
            Proposta propostaAcordada = contraProposta.getProposta();
            propostaAcordada.setValorProposta(contraProposta.getValorContraProposta());
            propostaRepository.save(propostaAcordada);
        }

        // Notificar quem criou a contraproposta
        Usuario criadorContraProposta = contraProposta.getUsuario();
        criarNotificacao(criadorContraProposta.getIdUsuario(),
                "Contraproposta aceita",
                "Sua contraproposta na proposta #" + contraProposta.getProposta().getIdProposta() + " foi aceita.",
                "CONTRAPROPOSTA_ACEITA", salvo.getIdContraProposta());

        return contraPropostaMapper.toDTO(salvo);
    }

    @Transactional
    public ContraPropostaResponseDTO rejeitarContraProposta(Long idContraProposta, ContraPropostaDecisionDTO decisionDTO, Usuario usuarioLogado) {
        ContraProposta contraProposta = contraPropostaRepository.findById(idContraProposta)
                .orElseThrow(() -> new EntityNotFoundException("Sem contra proposta com o ID informado."));

        // Somente o dono da proposta original pode aceitar/rejeitar
        if (!contraProposta.getProposta().getUsuario().getIdUsuario().equals(usuarioLogado.getIdUsuario())) {
            throw new BusinessException("Apenas o dono da proposta original pode decidir sobre a contraproposta.", "NAO_E_DONO_PROPOSTA");
        }

        if (contraProposta.getStatus() != ContraProposta.StatusContraProposta.PENDENTE) {
            throw new BusinessException("Esta contraproposta já foi decidida.", "CONTRAPROPOSTA_JA_DECIDIDA");
        }

        if (!"REJEITADA".equalsIgnoreCase(decisionDTO.status())) {
            throw new BusinessException("Para rejeitar, o status deve ser REJEITADA.", "STATUS_INVALIDO");
        }

        if (decisionDTO.justificativa() == null || decisionDTO.justificativa().isBlank()) {
            throw new BusinessException("Justificativa é obrigatória para rejeição.", "JUSTIFICATIVA_OBRIGATORIA");
        }

        contraProposta.setStatus(ContraProposta.StatusContraProposta.REJEITADA);
        contraProposta.setDataDecisao(LocalDateTime.now());
        contraProposta.setJustificativaDecisao(decisionDTO.justificativa().trim());

        ContraProposta salvo = contraPropostaRepository.save(contraProposta);

        // Notificar quem criou a contraproposta
        Usuario criadorContraProposta = contraProposta.getUsuario();
        criarNotificacao(criadorContraProposta.getIdUsuario(),
                "Contraproposta rejeitada",
                "Sua contraproposta na proposta #" + contraProposta.getProposta().getIdProposta() + " foi rejeitada. Justificativa: " + decisionDTO.justificativa(),
                "CONTRAPROPOSTA_REJEITADA", salvo.getIdContraProposta());

        return contraPropostaMapper.toDTO(salvo);
    }

    @Transactional
    public ContraPropostaResponseDTO atualizarContraProposta(Long idContraProposta, ContraPropostaRequestDTO requestDTO, Usuario usuarioLogado) {
        ContraProposta contraProposta = contraPropostaRepository.findById(idContraProposta)
                .orElseThrow(() -> new EntityNotFoundException("Sem contra proposta com o ID informado."));

        // Somente quem criou a contraproposta pode atualizar (se ainda estiver pendente)
        if (!contraProposta.getUsuario().getIdUsuario().equals(usuarioLogado.getIdUsuario())) {
            throw new BusinessException("Apenas quem criou a contraproposta pode atualizá-la.", "NAO_E_CRIADOR_CONTRAPROPOSTA");
        }

        if (contraProposta.getStatus() != ContraProposta.StatusContraProposta.PENDENTE) {
            throw new BusinessException("Não é possível atualizar uma contraproposta já decidida.", "CONTRAPROPOSTA_JA_DECIDIDA");
        }

        // A contraproposta continua na mesma proposta (não pode ser "movida" pela edição).
        Proposta proposta = contraProposta.getProposta();
        if (!proposta.getIdProposta().equals(requestDTO.idProposta())) {
            throw new BusinessException("A contraproposta não pode ser movida para outra proposta.", "CONTRAPROPOSTA_PROPOSTA_IMUTAVEL");
        }

        contraProposta.setDescricaoContraProposta(requestDTO.descricaoContraProposta());
        contraProposta.setValorContraProposta(requestDTO.valorContraProposta());
        contraProposta.setProposta(proposta);

        ContraProposta salvo = contraPropostaRepository.save(contraProposta);
        return contraPropostaMapper.toDTO(salvo);
    }

    @Transactional
    public void deletarContraProposta(Long idContraProposta, Usuario usuarioLogado) {
        ContraProposta contraProposta = contraPropostaRepository.findById(idContraProposta)
                .orElseThrow(() -> new EntityNotFoundException("Sem contra proposta com o ID informado."));

        // Somente quem criou a contraproposta ou admin pode deletar
        boolean isCriador = contraProposta.getUsuario().getIdUsuario().equals(usuarioLogado.getIdUsuario());
        boolean isAdmin = usuarioLogado.getRoles().stream()
                .anyMatch(r -> r.getNomeRole().name().equals("ADMIN"));

        if (!isCriador && !isAdmin) {
            throw new BusinessException("Apenas quem criou a contraproposta ou um admin pode deletá-la.", "NAO_PODE_DELETAR");
        }

        contraPropostaRepository.deleteById(idContraProposta);
    }

    /**
     * Verifica se há contraproposta pendente para uma proposta (usado para bloquear edição da proposta)
     */
    @Transactional(readOnly = true)
    public boolean existeContraPropostaPendenteParaProposta(Long propostaId) {
        return contraPropostaRepository.existsByProposta_IdPropostaAndStatus(
                propostaId, ContraProposta.StatusContraProposta.PENDENTE);
    }

    private void criarNotificacao(Long usuarioId, String titulo, String mensagem, String tipo, Long referenciaId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new BusinessException("Usuário não encontrado para notificação.", "USUARIO_NOT_FOUND"));
        Notificacao notificacao = new Notificacao();
        notificacao.setUsuario(usuario);
        notificacao.setTitulo(titulo);
        notificacao.setMensagem(mensagem);
        notificacao.setTipo(tipo);
        notificacao.setReferenciaId(referenciaId);
        notificacaoRepository.save(notificacao);
    }
}
