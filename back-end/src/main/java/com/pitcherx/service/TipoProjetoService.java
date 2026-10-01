package com.pitcherx.service;

import com.pitcherx.dto.tipoProjeto.TipoProjetoRequestDTO;
import com.pitcherx.dto.tipoProjeto.TipoProjetoResponseDTO;
import com.pitcherx.mapper.TipoProjetoMapper;
import com.pitcherx.model.TipoProjeto;
import com.pitcherx.repository.TipoProjetoRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TipoProjetoService {

    private final TipoProjetoRepository tipoProjetoRepository;
    private final TipoProjetoMapper tipoProjetoMapper;

    public TipoProjetoService(TipoProjetoRepository tipoProjetoRepository, TipoProjetoMapper tipoProjetoMapper) {
        this.tipoProjetoRepository = tipoProjetoRepository;
        this.tipoProjetoMapper = tipoProjetoMapper;
    }

    @Transactional(readOnly = true)
    public List<TipoProjetoResponseDTO> listarTiposProjeto(){
        return tipoProjetoRepository.findAll().stream()
                .map(tipoProjetoMapper::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public TipoProjetoResponseDTO buscarTipoProjetoPorId(Long idTipoProjeto){
        TipoProjeto tipoProjeto = tipoProjetoRepository.findById(idTipoProjeto)
                .orElseThrow(() -> new EntityNotFoundException("Sem tipo de projeto com o ID informado!"));
        return tipoProjetoMapper.toDTO(tipoProjeto);
    }

    @Transactional
    public TipoProjetoResponseDTO criarTipoProjeto(TipoProjetoRequestDTO tipoProjetoRequestDTO){

        if (tipoProjetoRepository.existsByNomeTipoProjeto(tipoProjetoRequestDTO.nomeTipoProjeto())){
            throw new IllegalArgumentException("Já existe um tipo de projeto com esse nome!");
        }

        TipoProjeto tipoProjeto = tipoProjetoMapper.toEntity(tipoProjetoRequestDTO);

        TipoProjeto salvo = tipoProjetoRepository.save(tipoProjeto);
        return tipoProjetoMapper.toDTO(salvo);

    }

    @Transactional
    public TipoProjetoResponseDTO atualizarTipoProjeto(Long idTipoProjeto, TipoProjetoRequestDTO tipoProjetoRequestDTO){
        TipoProjeto tipoProjeto = tipoProjetoRepository.findById(idTipoProjeto)
                .orElseThrow(() -> new EntityNotFoundException("Sem tipo de projeto com o ID informado!"));

        if (tipoProjetoRepository.existsByNomeTipoProjetoAndIdTipoProjetoNot(tipoProjetoRequestDTO.nomeTipoProjeto(), idTipoProjeto)){
            throw new IllegalArgumentException("Já existe um tipo de projeto com esse nome!");
        }

        tipoProjetoMapper.updateFromDTO(tipoProjetoRequestDTO, tipoProjeto);

        TipoProjeto salvo = tipoProjetoRepository.save(tipoProjeto);
        return tipoProjetoMapper.toDTO(salvo);
    }

    @Transactional
    public void deletarTipoProjeto(Long idTipoProjeto){
        if (!tipoProjetoRepository.existsById(idTipoProjeto)){
            throw new EntityNotFoundException("Sem tipo de projeto com o ID informado!");
        }
        try {
            tipoProjetoRepository.deleteById(idTipoProjeto);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalStateException("Não é possível deletar o tipo de projeto, pois ele está associado a uma ou mais entidades!");
        }
    }

}
