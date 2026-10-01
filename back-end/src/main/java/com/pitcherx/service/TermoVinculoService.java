package com.pitcherx.service;

import com.pitcherx.dto.termoVinculo.TermoVinculoRequestDTO;
import com.pitcherx.dto.termoVinculo.TermoVinculoResponseDTO;
import com.pitcherx.mapper.TermoVinculoMapper;
import com.pitcherx.model.TermoVinculo;
import com.pitcherx.repository.TermoVinculoRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TermoVinculoService {

    private final TermoVinculoRepository termoVinculoRepository;
    private final TermoVinculoMapper termoVinculoMapper;

    public TermoVinculoService(TermoVinculoRepository termoVinculoRepository, TermoVinculoMapper termoVinculoMapper) {
        this.termoVinculoRepository = termoVinculoRepository;
        this.termoVinculoMapper = termoVinculoMapper;
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

    @Transactional
    public TermoVinculoResponseDTO criarTermoVinculo(TermoVinculoRequestDTO termoVinculoRequestDTO){

        if (termoVinculoRepository.existsByTituloTermoVinculo(termoVinculoRequestDTO.tituloTermoVinculo())){
            throw new IllegalArgumentException("Já existe um termo de vínculo com esse título!");
        }

        TermoVinculo termoVinculo = termoVinculoMapper.toEntity(termoVinculoRequestDTO);

        TermoVinculo salvo = termoVinculoRepository.save(termoVinculo);
        return termoVinculoMapper.toDTO(salvo);
    }

    @Transactional
    public TermoVinculoResponseDTO atualizarTermoVinculo(Long idTermoVinculo, TermoVinculoRequestDTO termoVinculoRequestDTO){
        TermoVinculo termoVinculo = termoVinculoRepository.findById(idTermoVinculo)
                .orElseThrow(() -> new EntityNotFoundException("Sem termo de vínculo com o ID informado!"));

        if (termoVinculoRepository.existsByTituloTermoVinculoAndIdTermoVinculoNot(termoVinculoRequestDTO.tituloTermoVinculo(), idTermoVinculo)){
            throw new IllegalArgumentException("Já existe um termo de vínculo com esse título!");
        }

        termoVinculoMapper.updateFromDTO(termoVinculoRequestDTO, termoVinculo);

        TermoVinculo salvo = termoVinculoRepository.save(termoVinculo);
        return termoVinculoMapper.toDTO(salvo);
    }

    @Transactional
    public void deletarTermoVinculo(Long idTermoVinculo){
        if(!termoVinculoRepository.existsById(idTermoVinculo)){
            throw new EntityNotFoundException("Sem termo de vínculo com o ID informado!");
        }
        try {
            termoVinculoRepository.deleteById(idTermoVinculo);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalStateException("Não é possível deletar o termo de vínculo, pois ele está associado a outras entidades!");
        }
    }

}
