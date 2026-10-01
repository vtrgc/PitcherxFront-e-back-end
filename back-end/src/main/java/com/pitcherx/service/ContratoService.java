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
import com.pitcherx.repository.ContratoRepository;
import com.pitcherx.repository.ProjetoRepository;

import jakarta.persistence.EntityNotFoundException;

@Service
public class ContratoService {

    private final ContratoRepository contratoRepository;
    private final ContratoMapper contratoMapper;
    private final ProjetoRepository projetoRepository;

    public ContratoService(ContratoRepository contratoRepository, ContratoMapper contratoMapper,
            ProjetoRepository projetoRepository) {
        this.contratoRepository = contratoRepository;
        this.contratoMapper = contratoMapper;
        this.projetoRepository = projetoRepository;
    }

    @Transactional(readOnly = true)
    public List<ContratoResponseDTO> listarContratos(){
        return contratoRepository.findAll().stream()
                .map(contratoMapper::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public ContratoResponseDTO buscarContratoPorId(Long idContrato) {
        Contrato contrato = contratoRepository.findById(idContrato)
                .orElseThrow(() -> new EntityNotFoundException("Sem contrato com o ID informado!"));
        return contratoMapper.toDTO(contrato);
    }

    @Transactional
    public ContratoResponseDTO criarContrato(ContratoRequestDTO contratoRequestDTO) {
        Projeto projeto = projetoRepository.findById(contratoRequestDTO.projetoId())
                .orElseThrow(() -> new EntityNotFoundException("Sem projeto com o ID informado!"));

        Contrato contrato = contratoMapper.toEntity(contratoRequestDTO);
        contrato.setProjeto(projeto);
        contrato.setActive(true);

        Contrato salvo = contratoRepository.save(contrato);
        return contratoMapper.toDTO(salvo);
    }

    @Transactional
    public ContratoResponseDTO atualizarContrato(Long idContrato, ContratoRequestDTO contratoRequestDTO) {
        Contrato contrato = contratoRepository.findById(idContrato)
                .orElseThrow(() -> new EntityNotFoundException("Sem contrato com o ID informado!"));

        Projeto projeto = projetoRepository.findById(contratoRequestDTO.projetoId())
                .orElseThrow(() -> new EntityNotFoundException("Sem projeto com o ID informado!"));

        contratoMapper.toUpdate(contratoRequestDTO, contrato);
        contrato.setProjeto(projeto);

        Contrato salvo = contratoRepository.save(contrato);
        return contratoMapper.toDTO(salvo);
    }

    @Transactional
    public void deletarContrato(Long idContrato) {
        if(!contratoRepository.existsById(idContrato)) {
            throw new EntityNotFoundException("Sem contrato com o ID informado!");
        }
        try {
            contratoRepository.deleteById(idContrato);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalArgumentException("Não é possível deletar este contrato, pois ele está associada a outras entidades.");
        }
    }

}
