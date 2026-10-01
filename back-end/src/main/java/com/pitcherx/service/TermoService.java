package com.pitcherx.service;

import com.pitcherx.dto.termo.TermoRequestDTO;
import com.pitcherx.dto.termo.TermoResponseDTO;
import com.pitcherx.mapper.TermoMapper;
import com.pitcherx.model.Contrato;
import com.pitcherx.model.Termo;
import com.pitcherx.repository.ContratoRepository;
import com.pitcherx.repository.TermoRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TermoService {

    private final TermoRepository termoRepository;
    private final TermoMapper termoMapper;
    private final ContratoRepository contratoRepository;

    public TermoService(TermoRepository termoRepository, TermoMapper termoMapper, ContratoRepository contratoRepository) {
        this.termoRepository = termoRepository;
        this.termoMapper = termoMapper;
        this.contratoRepository = contratoRepository;
    }

    @Transactional(readOnly = true)
    public List<TermoResponseDTO> listarTermos(){
        return termoRepository.findAll().stream()
                .map(termoMapper::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public TermoResponseDTO buscarTermoPorId(Long idTermo){
        Termo termo = termoRepository.findById(idTermo)
                .orElseThrow(() -> new EntityNotFoundException("Sem termo com o ID informado!"));
        return termoMapper.toDTO(termo);
    }

    @Transactional
    public TermoResponseDTO criarTermo(TermoRequestDTO termoRequestDTO){
        Contrato contrato = contratoRepository.findById(termoRequestDTO.contratoId())
                .orElseThrow(() -> new EntityNotFoundException("Sem contrato com o ID informado!"));

        Termo termo = termoMapper.toEntity(termoRequestDTO);
        termo.setContrato(contrato);

        Termo termoSalvo = termoRepository.save(termo);
        return termoMapper.toDTO(termoSalvo);
    }

    @Transactional
    public TermoResponseDTO atualizarTermo(Long idTermo, TermoRequestDTO termoRequestDTO){
        Termo termo = termoRepository.findById(idTermo)
                .orElseThrow(() -> new EntityNotFoundException("Sem termo com o ID informado!"));

        Contrato contrato = contratoRepository.findById(termoRequestDTO.contratoId())
                .orElseThrow(() -> new EntityNotFoundException("Sem contrato com o ID informado!"));

        termoMapper.toUpdate(termoRequestDTO, termo);
        termo.setContrato(contrato);

        Termo termoSalvo = termoRepository.save(termo);
        return termoMapper.toDTO(termoSalvo);
    }

    @Transactional
    public void deletarTermo(Long idTermo){
        if(!termoRepository.existsById(idTermo)){
            throw new EntityNotFoundException("Sem termo com o ID informado!");
        }
        try {
            termoRepository.deleteById(idTermo);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalArgumentException("Não é possível deletar este termo, pois ele está associada a outras entidades.");
        }
    }

}
