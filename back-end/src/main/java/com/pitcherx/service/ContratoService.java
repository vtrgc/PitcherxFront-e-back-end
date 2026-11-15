package com.pitcherx.service;

import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pitcherx.dto.contrato.ContratoRequestDTO;
import com.pitcherx.dto.contrato.ContratoResponseDTO;
import com.pitcherx.mapper.ContratoMapper;
import com.pitcherx.model.Contrato;
import com.pitcherx.model.Projeto;
import com.pitcherx.model.Proposta;
import com.pitcherx.repository.ContratoRepository;
import com.pitcherx.repository.ProjetoRepository;
import com.pitcherx.repository.PropostaRepository;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import com.pitcherx.exceptions.BusinessException;
import com.pitcherx.repository.ProjetoUsuarioRepository;
import com.pitcherx.security.Permissoes;

@Service
public class ContratoService {

    private final ContratoRepository contratoRepository;
    private final ContratoMapper contratoMapper;
    private final ProjetoRepository projetoRepository;
    private final PropostaRepository propostaRepository;

    public ContratoService(ContratoRepository contratoRepository, ContratoMapper contratoMapper,
            ProjetoRepository projetoRepository, PropostaRepository propostaRepository) {
        this.contratoRepository = contratoRepository;
        this.contratoMapper = contratoMapper;
        this.projetoRepository = projetoRepository;
        this.propostaRepository = propostaRepository;
    }

    @Autowired
    private Permissoes permissoes;

    @Autowired
    private ProjetoUsuarioRepository projetoUsuarioRepository;

    private boolean ehCriador(Projeto projeto, Long idUsuario) {
        if (projeto.getUsuarioCriador() != null) return idUsuario.equals(projeto.getUsuarioCriador().getIdUsuario());
        return projetoUsuarioRepository.existsByUsuario_IdUsuarioAndProjeto_IdProjeto(idUsuario, projeto.getIdProjeto())
                && projeto.getUsuarios() != null && projeto.getUsuarios().stream().anyMatch(pu -> pu.getUsuario() != null
                        && idUsuario.equals(pu.getUsuario().getIdUsuario()) && pu.getTipoVinculo() != null
                        && "CRIADOR".equals(pu.getTipoVinculo().getNomeTipoVinculo()));
    }

    /** Partes do contrato: administrador, membros do projeto (criador/sócio/investidor) e o autor da proposta. */
    private boolean podeVer(Contrato contrato) {
        if (permissoes.isAdmin()) return true;
        Long eu = permissoes.idUsuarioAtual();
        if (contrato.getProposta() != null && contrato.getProposta().getUsuario() != null
                && eu.equals(contrato.getProposta().getUsuario().getIdUsuario())) return true;
        return contrato.getProjeto() != null && contrato.getProjeto().getUsuarios() != null
                && contrato.getProjeto().getUsuarios().stream().anyMatch(pu -> pu.getUsuario() != null
                        && eu.equals(pu.getUsuario().getIdUsuario()) && pu.getTipoVinculo() != null
                        && List.of("CRIADOR", "SOCIO", "INVESTIDOR").contains(pu.getTipoVinculo().getNomeTipoVinculo()));
    }

    private void exigirCriadorOuAdmin(Projeto projeto, String mensagem) {
        if (permissoes.isAdmin()) return;
        if (!ehCriador(projeto, permissoes.idUsuarioAtual())) throw new AccessDeniedException(mensagem);
    }

    @Transactional(readOnly = true)
    public List<ContratoResponseDTO> listarContratos(){
        return contratoRepository.findAll().stream()
                .filter(this::podeVer)
                .map(contratoMapper::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public ContratoResponseDTO buscarContratoPorId(Long idContrato) {
        Contrato contrato = contratoRepository.findById(idContrato)
                .orElseThrow(() -> new EntityNotFoundException("Sem contrato com o ID informado!"));
        if (!podeVer(contrato)) throw new AccessDeniedException("Este contrato é visível apenas para as partes envolvidas.");
        return contratoMapper.toDTO(contrato);
    }

    /** A proposta precisa existir, ser do mesmo projeto e não estar recusada. */
    private Proposta propostaValida(Long propostaId, Projeto projeto) {
        Proposta proposta = propostaRepository.findById(propostaId)
                .orElseThrow(() -> new EntityNotFoundException("Sem proposta com o ID informado!"));
        if (proposta.getProjeto() == null || !proposta.getProjeto().getIdProjeto().equals(projeto.getIdProjeto())) {
            throw new BusinessException("A proposta informada não pertence a este projeto.", "PROPOSTA_DE_OUTRO_PROJETO");
        }
        if ("RECUSADA".equals(proposta.getStatusProposta())) {
            throw new BusinessException("Não é possível formalizar uma proposta recusada.", "PROPOSTA_RECUSADA");
        }
        return proposta;
    }

    private void validarDatas(ContratoRequestDTO dto) {
        if (!dto.dataFimContrato().isAfter(dto.dataInicioContrato())) {
            throw new BusinessException("A data de término deve ser posterior à data de início.", "DATAS_INVALIDAS");
        }
    }

    @Transactional
    public ContratoResponseDTO criarContrato(ContratoRequestDTO contratoRequestDTO) {
        Projeto projeto = projetoRepository.findById(contratoRequestDTO.projetoId())
                .orElseThrow(() -> new EntityNotFoundException("Sem projeto com o ID informado!"));
        exigirCriadorOuAdmin(projeto, "Apenas o criador do projeto pode criar contratos.");
        validarDatas(contratoRequestDTO);
        Proposta proposta = propostaValida(contratoRequestDTO.propostaId(), projeto);
        if (contratoRepository.findByPropostaIdAndStatusContrato(proposta.getIdProposta(), "PENDENTE") != null) {
            throw new BusinessException("Já existe um contrato aguardando aceite para esta proposta.", "CONTRATO_PENDENTE_DUPLICADO");
        }

        Contrato contrato = contratoMapper.toEntity(contratoRequestDTO);
        contrato.setProjeto(projeto);
        contrato.setProposta(proposta);
        contrato.setStatusContrato("PENDENTE");
        contrato.setActive(true);

        Contrato salvo = contratoRepository.save(contrato);
        return contratoMapper.toDTO(salvo);
    }

    @Transactional
    public ContratoResponseDTO atualizarContrato(Long idContrato, ContratoRequestDTO contratoRequestDTO) {
        Contrato contrato = contratoRepository.findById(idContrato)
                .orElseThrow(() -> new EntityNotFoundException("Sem contrato com o ID informado!"));
        exigirCriadorOuAdmin(contrato.getProjeto(), "Apenas o criador do projeto pode editar este contrato.");
        if (!contrato.getProjeto().getIdProjeto().equals(contratoRequestDTO.projetoId())) {
            throw new BusinessException("O contrato não pode ser movido para outro projeto.", "CONTRATO_PROJETO_IMUTAVEL");
        }
        if ("ACEITE".equals(contrato.getStatusContrato())) {
            throw new BusinessException("Um contrato já aceito não pode ser alterado.", "CONTRATO_ACEITO");
        }
        validarDatas(contratoRequestDTO);
        Proposta proposta = propostaValida(contratoRequestDTO.propostaId(), contrato.getProjeto());

        contratoMapper.toUpdate(contratoRequestDTO, contrato);
        contrato.setProposta(proposta);

        Contrato salvo = contratoRepository.save(contrato);
        return contratoMapper.toDTO(salvo);
    }

    @Transactional
    public void deletarContrato(Long idContrato) {
        Contrato contrato = contratoRepository.findById(idContrato)
                .orElseThrow(() -> new EntityNotFoundException("Sem contrato com o ID informado!"));
        exigirCriadorOuAdmin(contrato.getProjeto(), "Apenas o criador do projeto ou um administrador pode excluir este contrato.");
        try {
            contratoRepository.delete(contrato);
            contratoRepository.flush();
        } catch (DataIntegrityViolationException e) {
            throw new IllegalArgumentException("Não é possível excluir este contrato: remova antes os termos vinculados a ele.");
        }
    }

    /**
     * Aceite do contrato pela outra parte (o autor da proposta) ou pelo administrador.
     * O valor NÃO é somado aqui: ele entra no arrecadado quando o criador aceita a proposta
     * (PropostaService.aceitarProposta). Antes era somado nos dois momentos (contagem em dobro).
     */
    @Transactional
    public ContratoResponseDTO aceitarContrato(Long idContrato) {
        Contrato contrato = contratoRepository.findById(idContrato)
                .orElseThrow(() -> new EntityNotFoundException("Sem contrato com o ID informado!"));

        if (!"PENDENTE".equals(contrato.getStatusContrato())) {
            throw new BusinessException("Este contrato já foi processado!", "CONTRATO_JA_PROCESSADO");
        }
        if (!permissoes.isAdmin()) {
            Long eu = permissoes.idUsuarioAtual();
            boolean autorDaProposta = contrato.getProposta() != null && contrato.getProposta().getUsuario() != null
                    && eu.equals(contrato.getProposta().getUsuario().getIdUsuario());
            if (!autorDaProposta) {
                throw new AccessDeniedException("Apenas o autor da proposta pode aceitar este contrato.");
            }
        }

        contrato.setStatusContrato("ACEITE");
        Contrato salvo = contratoRepository.save(contrato);
        return contratoMapper.toDTO(salvo);
    }

}
