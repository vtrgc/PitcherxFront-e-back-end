package com.pitcherx.service;

import com.pitcherx.dto.riscoProjeto.RiscoProjetoRequestDTO;
import com.pitcherx.dto.riscoProjeto.RiscoProjetoResponseDTO;
import com.pitcherx.mapper.RiscoProjetoMapper;
import com.pitcherx.model.RiscoProjeto;
import com.pitcherx.repository.RiscoProjetoRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RiscoProjetoService {

    private final RiscoProjetoRepository riscoProjetoRepository;
    private final RiscoProjetoMapper riscoProjetoMapper;

    public RiscoProjetoService(RiscoProjetoRepository riscoProjetoRepository, RiscoProjetoMapper riscoProjetoMapper) {
        this.riscoProjetoRepository = riscoProjetoRepository;
        this.riscoProjetoMapper = riscoProjetoMapper;
    }

    @Transactional(readOnly = true)
    public List<RiscoProjetoResponseDTO> listarRiscosProjeto() {
        return riscoProjetoRepository.findAll().stream().map(riscoProjetoMapper::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public RiscoProjetoResponseDTO buscarRiscoProjetoPorId(Long idRiscoProjeto) {
        return riscoProjetoMapper.toDTO(buscarEntidade(idRiscoProjeto));
    }

    @Transactional
    public RiscoProjetoResponseDTO criarRiscoProjeto(RiscoProjetoRequestDTO requestDTO) {
        String nomeRisco = normalizarNome(requestDTO.nomeRisco());
        validarNomeDisponivel(nomeRisco, null);

        RiscoProjeto riscoProjeto = riscoProjetoMapper.toEntity(requestDTO);
        riscoProjeto.setNomeRisco(nomeRisco);
        try {
            return riscoProjetoMapper.toDTO(riscoProjetoRepository.saveAndFlush(riscoProjeto));
        } catch (DataIntegrityViolationException exception) {
            throw new IllegalStateException("Já existe um risco de projeto com esse nome.");
        }
    }

    @Transactional
    public RiscoProjetoResponseDTO atualizarRiscoProjeto(Long idRiscoProjeto, RiscoProjetoRequestDTO requestDTO) {
        RiscoProjeto riscoProjeto = buscarEntidade(idRiscoProjeto);
        String nomeRisco = normalizarNome(requestDTO.nomeRisco());
        validarNomeDisponivel(nomeRisco, idRiscoProjeto);

        riscoProjetoMapper.updateFromDTO(requestDTO, riscoProjeto);
        riscoProjeto.setNomeRisco(nomeRisco);
        try {
            return riscoProjetoMapper.toDTO(riscoProjetoRepository.saveAndFlush(riscoProjeto));
        } catch (DataIntegrityViolationException exception) {
            throw new IllegalStateException("Já existe um risco de projeto com esse nome.");
        }
    }

    @Transactional
    public void deletarRiscoProjeto(Long idRiscoProjeto) {
        RiscoProjeto riscoProjeto = buscarEntidade(idRiscoProjeto);
        if (!riscoProjeto.getProjetos().isEmpty()) {
            throw new IllegalStateException("Não é possível excluir um risco associado a projetos.");
        }
        try {
            riscoProjetoRepository.delete(riscoProjeto);
            riscoProjetoRepository.flush();
        } catch (DataIntegrityViolationException exception) {
            throw new IllegalStateException("Não é possível excluir um risco associado a projetos.");
        }
    }

    private RiscoProjeto buscarEntidade(Long idRiscoProjeto) {
        return riscoProjetoRepository.findById(idRiscoProjeto)
                .orElseThrow(() -> new EntityNotFoundException("Sem risco de projeto com o ID informado!"));
    }

    private void validarNomeDisponivel(String nomeRisco, Long idIgnorado) {
        boolean existente = idIgnorado == null
                ? riscoProjetoRepository.existsByNomeRisco(nomeRisco)
                : riscoProjetoRepository.existsByNomeRiscoAndIdRiscoProjetoNot(nomeRisco, idIgnorado);
        if (existente) {
            throw new IllegalStateException("Já existe um risco de projeto com esse nome!");
        }
    }

    private String normalizarNome(String nomeRisco) {
        return nomeRisco.trim();
    }
}
