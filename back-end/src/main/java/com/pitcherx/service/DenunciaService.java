package com.pitcherx.service;

import com.pitcherx.dto.denuncia.DenunciaAdminDecisionDTO;
import com.pitcherx.dto.denuncia.DenunciaApelacaoDTO;
import com.pitcherx.dto.denuncia.DenunciaCategoriaDTO;
import com.pitcherx.dto.denuncia.DenunciaRequestDTO;
import com.pitcherx.dto.denuncia.DenunciaResponseDTO;
import com.pitcherx.exceptions.BusinessException;
import com.pitcherx.mapper.DenunciaMapper;
import com.pitcherx.model.Denuncia;
import com.pitcherx.model.Notificacao;
import com.pitcherx.model.Usuario;
import com.pitcherx.repository.DenunciaRepository;
import com.pitcherx.repository.NotificacaoRepository;
import com.pitcherx.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DenunciaService {

    private static final int LIMITE_DENUNCIAS_POR_DIA = 30;

    private final DenunciaRepository denunciaRepository;
    private final UsuarioRepository usuarioRepository;
    private final NotificacaoRepository notificacaoRepository;
    private final DenunciaMapper denunciaMapper;

    @Transactional
    public DenunciaResponseDTO criarDenuncia(DenunciaRequestDTO requestDTO, Usuario denunciante) {
        if (requestDTO.tipoDenuncia() == Denuncia.TipoDenuncia.PERFIL
                && requestDTO.alvoId().equals(denunciante.getIdUsuario())) {
            throw new BusinessException("Não é possível denunciar o próprio perfil", "SELF_REPORT_NOT_ALLOWED");
        }

        LocalDateTime hojeInicio = LocalDateTime.now().toLocalDate().atStartOfDay();
        LocalDateTime hojeFim = hojeInicio.plusDays(1);

        long totalHoje = denunciaRepository.countByDenuncianteIdAndDataCriacaoBetween(
                denunciante.getIdUsuario(), hojeInicio, hojeFim);
        if (totalHoje >= LIMITE_DENUNCIAS_POR_DIA) {
            throw new BusinessException("Limite diario de denuncias excedido (30 por dia)", "REPORT_DAILY_LIMIT_EXCEEDED");
        }

        boolean duplicata = denunciaRepository.existsByDenuncianteIdAndAlvoIdAndTipoDenuncia(
                denunciante.getIdUsuario(), requestDTO.alvoId(), requestDTO.tipoDenuncia());
        if (duplicata) {
            throw new BusinessException("Voce ja denunciou este conteudo hoje", "DUPLICATE_REPORT");
        }

        Denuncia denuncia = denunciaMapper.toEntity(requestDTO);
        denuncia.setDenuncianteId(denunciante.getIdUsuario());
        denuncia.setPrioridade(calcularPrioridade(requestDTO.categoria()));
        denuncia.setApelacaoSolicitada(Boolean.FALSE);
        denuncia = denunciaRepository.save(denuncia);

        notificarAdminsNovaDenuncia(denuncia);

        return denunciaMapper.toDTO(denuncia);
    }

    @Transactional(readOnly = true)
    public Page<DenunciaResponseDTO> listarPendentes(Pageable pageable) {
        return denunciaRepository.findByStatus(Denuncia.StatusDenuncia.PENDENTE, pageable)
                .map(denunciaMapper::toDTO);
    }

    @Transactional(readOnly = true)
    public DenunciaResponseDTO buscarPorId(Long id, Usuario solicitante) {
        Denuncia denuncia = denunciaRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Denúncia não encontrada", "DENUNCIA_NOT_FOUND"));

        boolean isAdmin = solicitante.getRoles().stream()
                .anyMatch(r -> r.getNomeRole() == com.pitcherx.security.RoleType.ADMIN);
        if (!isAdmin && !denuncia.getDenuncianteId().equals(solicitante.getIdUsuario())) {
            throw new BusinessException("Acesso negado a esta denúncia", "ACCESS_DENIED");
        }

        return denunciaMapper.toDTO(denuncia);
    }

    @Transactional(readOnly = true)
    public Page<DenunciaResponseDTO> listarPorDenunciante(Long denuncianteId, Pageable pageable) {
        return denunciaRepository.findByDenuncianteIdOrderByDataCriacaoDesc(denuncianteId, pageable)
                .map(denunciaMapper::toDTO);
    }

    @Transactional
    public DenunciaResponseDTO decidir(Long id, DenunciaAdminDecisionDTO decisionDTO, Usuario admin) {
        Denuncia denuncia = denunciaRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Denúncia não encontrada", "DENUNCIA_NOT_FOUND"));

        if (denuncia.getStatus() != Denuncia.StatusDenuncia.PENDENTE) {
            throw new BusinessException("Apenas denúncias pendentes podem ser decididas", "INVALID_STATUS_FOR_DECISION");
        }

        if (decisionDTO.status() != Denuncia.StatusDenuncia.ACEITA
                && decisionDTO.status() != Denuncia.StatusDenuncia.REJEITADA) {
            throw new BusinessException("Status invalido. Use ACEITA ou REJEITADA", "INVALID_DECISION_STATUS");
        }

        denuncia.setStatus(decisionDTO.status());
        denuncia.setDecisaoAdmin(decisionDTO.decisaoAdmin());
        denuncia.setAcaoTomada(decisionDTO.acaoTomada());
        denuncia.setAdminId(admin.getIdUsuario());
        denuncia.setDataDecisao(LocalDateTime.now());

        denuncia = denunciaRepository.save(denuncia);

        notificarDenuncianteResultado(denuncia);

        return denunciaMapper.toDTO(denuncia);
    }

    @Transactional
    public DenunciaResponseDTO solicitarApelacao(Long id, DenunciaApelacaoDTO apelacaoDTO, Usuario solicitante) {
        Denuncia denuncia = denunciaRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Denúncia não encontrada", "DENUNCIA_NOT_FOUND"));

        if (denuncia.getStatus() != Denuncia.StatusDenuncia.ACEITA) {
            throw new BusinessException("Apelacao so e permitida para denuncias aceitas", "APEAL_ONLY_FOR_ACCEPTED");
        }

        if (Boolean.TRUE.equals(denuncia.getApelacaoSolicitada())) {
            throw new BusinessException("Apelacao ja foi solicitada para esta denuncia", "APPEAL_ALREADY_REQUESTED");
        }

        denuncia.setApelacaoSolicitada(Boolean.TRUE);
        denuncia.setApelacaoJustificativa(apelacaoDTO.justificativa());
        denuncia.setApelacaoData(LocalDateTime.now());

        denuncia = denunciaRepository.save(denuncia);

        notificarAdminsApelacao(denuncia, solicitante);

        return denunciaMapper.toDTO(denuncia);
    }

    @Transactional
    public DenunciaResponseDTO decidirApelacao(Long id, DenunciaAdminDecisionDTO decisionDTO, Usuario admin) {
        Denuncia denuncia = denunciaRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Denúncia não encontrada", "DENUNCIA_NOT_FOUND"));

        if (!Boolean.TRUE.equals(denuncia.getApelacaoSolicitada())) {
            throw new BusinessException("Nao ha apelacao pendente para esta denuncia", "NO_PENDING_APPEAL");
        }

        denuncia.setStatus(decisionDTO.status());
        denuncia.setDecisaoAdmin(decisionDTO.decisaoAdmin());
        denuncia.setAcaoTomada(decisionDTO.acaoTomada());
        denuncia.setApelacaoDecisao(decisionDTO.status().name());
        denuncia.setApelacaoData(LocalDateTime.now());
        denuncia.setAdminId(admin.getIdUsuario());

        denuncia = denunciaRepository.save(denuncia);

        notificarDenuncianteResultado(denuncia);

        return denunciaMapper.toDTO(denuncia);
    }

    @Transactional(readOnly = true)
    public List<DenunciaCategoriaDTO> listarCategorias(String tipoDenuncia) {
        return List.of(
                new DenunciaCategoriaDTO("SPAM", "Spam", tipoDenuncia),
                new DenunciaCategoriaDTO("NUDEZ", "Nudez / atividade sexual", tipoDenuncia),
                new DenunciaCategoriaDTO("DISCURSO_ODIO", "Discurso de odio", tipoDenuncia),
                new DenunciaCategoriaDTO("ASSÉDIO", "Assedio / bullying", tipoDenuncia),
                new DenunciaCategoriaDTO("VENDA_ILEGAL", "Venda ilegal de produtos", tipoDenuncia),
                new DenunciaCategoriaDTO("PROPRIEDADE_INTELECTUAL", "Propriedade intelectual", tipoDenuncia),
                new DenunciaCategoriaDTO("AUTOMUTILACAO", "Automutilacao", tipoDenuncia),
                new DenunciaCategoriaDTO("INFO_FALSA", "Informacao falsa", tipoDenuncia),
                new DenunciaCategoriaDTO("CONTEUDO_SENSIVEL", "Conteudo sensivel / chocante", tipoDenuncia),
                new DenunciaCategoriaDTO("IDENTIDADE_FALSA", "Identidade falsa / personificacao", tipoDenuncia),
                new DenunciaCategoriaDTO("MENOR_RISCO", "Menor em situacao de risco", tipoDenuncia),
                new DenunciaCategoriaDTO("OUTROS", "Outros", tipoDenuncia)
        );
    }

    private Denuncia.PrioridadeDenuncia calcularPrioridade(String categoria) {
        return switch (categoria) {
            case "AUTOMUTILACAO", "MENOR_RISCO", "DISCURSO_ODIO" -> Denuncia.PrioridadeDenuncia.CRITICA;
            case "NUDEZ", "ASSÉDIO", "VENDA_ILEGAL" -> Denuncia.PrioridadeDenuncia.ALTA;
            case "SPAM", "INFO_FALSA", "IDENTIDADE_FALSA" -> Denuncia.PrioridadeDenuncia.MEDIA;
            default -> Denuncia.PrioridadeDenuncia.BAIXA;
        };
    }

    private void notificarAdminsNovaDenuncia(Denuncia denuncia) {
        List<Usuario> admins = usuarioRepository.findByRoles_NomeRole(com.pitcherx.security.RoleType.ADMIN);
        String mensagem = String.format(
                "Nova denuncia pendente #%d - Tipo: %s - Categoria: %s - Prioridade: %s",
                denuncia.getIdDenuncia(), denuncia.getTipoDenuncia(), denuncia.getCategoria(), denuncia.getPrioridade());
        for (Usuario admin : admins) {
            criarNotificacao(admin.getIdUsuario(),
                    "Nova denuncia para revisao", mensagem, "DENUNCIA_NOVA", denuncia.getIdDenuncia());
        }
    }

    private void notificarAdminsApelacao(Denuncia denuncia, Usuario solicitante) {
        List<Usuario> admins = usuarioRepository.findByRoles_NomeRole(com.pitcherx.security.RoleType.ADMIN);
        String mensagem = String.format(
                "Apelacao solicitada na denuncia #%d pelo usuario %d. Justificativa: %s",
                denuncia.getIdDenuncia(), solicitante.getIdUsuario(), denuncia.getApelacaoJustificativa());
        for (Usuario admin : admins) {
            criarNotificacao(admin.getIdUsuario(),
                    "Apelacao de denuncia", mensagem, "DENUNCIA_APELACAO", denuncia.getIdDenuncia());
        }
    }

    private void notificarDenuncianteResultado(Denuncia denuncia) {
        String status = denuncia.getStatus() == Denuncia.StatusDenuncia.ACEITA ? "aceita" : "rejeitada";
        String mensagem = String.format(
                "Sua denuncia #%d foi %s. Acao tomada: %s",
                denuncia.getIdDenuncia(), status, denuncia.getAcaoTomada() != null ? denuncia.getAcaoTomada() : "NENHUMA");
        criarNotificacao(denuncia.getDenuncianteId(),
                "Resultado da sua denuncia", mensagem, "DENUNCIA_RESULTADO", denuncia.getIdDenuncia());
    }

    private void criarNotificacao(Long usuarioId, String titulo, String mensagem, String tipo, Long referenciaId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new BusinessException("Usuario nao encontrado para notificacao", "USER_NOT_FOUND"));
        Notificacao notificacao = new Notificacao();
        notificacao.setUsuario(usuario);
        notificacao.setTitulo(titulo);
        notificacao.setMensagem(mensagem);
        notificacao.setTipo(tipo);
        notificacao.setReferenciaId(referenciaId);
        notificacaoRepository.save(notificacao);
    }
}
