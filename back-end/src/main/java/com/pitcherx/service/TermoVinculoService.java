package com.pitcherx.service;

import com.pitcherx.dto.termoVinculo.TermoVinculoRequestDTO;
import com.pitcherx.dto.termoVinculo.TermoVinculoResponseDTO;
import com.pitcherx.mapper.TermoVinculoMapper;
import com.pitcherx.model.Projeto;
import com.pitcherx.model.TermoVinculo;
import com.pitcherx.repository.ProjetoRepository;
import com.pitcherx.repository.TermoVinculoRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TermoVinculoService {

    private final TermoVinculoRepository termoVinculoRepository;
    private final TermoVinculoMapper termoVinculoMapper;
    private final ProjetoRepository projetoRepository;

    public TermoVinculoService(TermoVinculoRepository termoVinculoRepository,
                                 TermoVinculoMapper termoVinculoMapper, ProjetoRepository projetoRepository) {
        this.termoVinculoRepository = termoVinculoRepository;
        this.termoVinculoMapper = termoVinculoMapper;
        this.projetoRepository = projetoRepository;
    }

    @Transactional(readOnly = true)
    public List<TermoVinculoResponseDTO> listarTermosVinculo() {
        return termoVinculoRepository.findAll().stream()
                .map(termoVinculoMapper::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public TermoVinculoResponseDTO buscarTermoVinculoPorId(Long id) {
        TermoVinculo termoVinculo = termoVinculoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Sem termo de vínculo com o ID informado!"));
        return termoVinculoMapper.toDTO(termoVinculo);
    }

    @Transactional(readOnly = true)
    public List<TermoVinculoResponseDTO> listarTermosPorProjeto(Long projetoId) {
        if (!projetoRepository.existsById(projetoId)) {
            throw new EntityNotFoundException("Sem projeto com o ID informado!");
        }
        return termoVinculoRepository.findByProjeto_IdProjeto(projetoId).stream()
                .map(termoVinculoMapper::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TermoVinculoResponseDTO> listarTermosObrigatoriosPorProjeto(Long projetoId) {
        if (!projetoRepository.existsById(projetoId)) {
            throw new EntityNotFoundException("Sem projeto com o ID informado!");
        }
        return termoVinculoRepository.findByProjeto_IdProjetoAndObrigatorioTrue(projetoId).stream()
                .map(termoVinculoMapper::toDTO)
                .toList();
    }

    @org.springframework.beans.factory.annotation.Autowired
    private com.pitcherx.security.Permissoes permissoes;

    /** Termo de projeto: criador ou admin. Termo sem projeto (geral): só admin. */
    private void exigirCriadorOuAdmin(Projeto projeto, String mensagem) {
        if (permissoes.isAdmin()) return;
        Long eu = permissoes.idUsuarioAtual();
        boolean criador = projeto != null && (projeto.getUsuarioCriador() != null
                ? eu.equals(projeto.getUsuarioCriador().getIdUsuario())
                : projeto.getUsuarios() != null && projeto.getUsuarios().stream().anyMatch(pu -> pu.getUsuario() != null
                        && eu.equals(pu.getUsuario().getIdUsuario()) && pu.getTipoVinculo() != null
                        && "CRIADOR".equals(pu.getTipoVinculo().getNomeTipoVinculo())));
        if (!criador) throw new org.springframework.security.access.AccessDeniedException(mensagem);
    }

    @Transactional
    public TermoVinculoResponseDTO criarTermoVinculo(Long projetoId, TermoVinculoRequestDTO termoVinculoRequestDTO) {
        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new EntityNotFoundException("Sem projeto com o ID informado!"));

        exigirCriadorOuAdmin(projeto, "Apenas o criador do projeto pode cadastrar termos de vínculo.");

        if (termoVinculoRepository.existsByTituloTermoVinculoAndProjeto_IdProjeto(
                termoVinculoRequestDTO.tituloTermoVinculo(), projetoId)) {
            throw new IllegalArgumentException("Já existe um termo de vínculo com esse título para este projeto!");
        }

        TermoVinculo termoVinculo = termoVinculoMapper.toEntity(termoVinculoRequestDTO);
        termoVinculo.setProjeto(projeto);
        termoVinculo.setObrigatorio(termoVinculoRequestDTO.obrigatorio() != null && termoVinculoRequestDTO.obrigatorio());

        TermoVinculo salvo = termoVinculoRepository.save(termoVinculo);
        return termoVinculoMapper.toDTO(salvo);
    }

    @Transactional
    public TermoVinculoResponseDTO atualizarTermoVinculo(Long idTermoVinculo, TermoVinculoRequestDTO termoVinculoRequestDTO) {
        TermoVinculo termoVinculo = termoVinculoRepository.findById(idTermoVinculo)
                .orElseThrow(() -> new EntityNotFoundException("Sem termo de vínculo com o ID informado!"));
        exigirCriadorOuAdmin(termoVinculo.getProjeto(), "Apenas o criador do projeto pode alterar este termo.");

        boolean duplicado = termoVinculo.getProjeto() != null
                ? termoVinculoRepository.existsByTituloTermoVinculoAndProjeto_IdProjetoAndIdTermoVinculoNot(
                        termoVinculoRequestDTO.tituloTermoVinculo(), termoVinculo.getProjeto().getIdProjeto(), idTermoVinculo)
                : termoVinculoRepository.existsByTituloTermoVinculoAndIdTermoVinculoNot(termoVinculoRequestDTO.tituloTermoVinculo(), idTermoVinculo);
        if (duplicado) {
            throw new IllegalArgumentException("Já existe um termo de vínculo com esse título neste projeto!");
        }

        termoVinculoMapper.updateFromDTO(termoVinculoRequestDTO, termoVinculo);
        TermoVinculo salvo = termoVinculoRepository.save(termoVinculo);
        return termoVinculoMapper.toDTO(salvo);
    }

    @Transactional
    public void deletarTermoVinculo(Long idTermoVinculo) {
        TermoVinculo existente = termoVinculoRepository.findById(idTermoVinculo)
                .orElseThrow(() -> new EntityNotFoundException("Sem termo de vínculo com o ID informado!"));
        exigirCriadorOuAdmin(existente.getProjeto(), "Apenas o criador do projeto ou um administrador pode excluir este termo.");
        try {
            termoVinculoRepository.deleteById(idTermoVinculo);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalStateException("Não é possível deletar o termo de vínculo, pois ele está associado a outras entidades!");
        }
    }
}