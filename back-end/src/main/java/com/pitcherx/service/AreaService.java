package com.pitcherx.service;

import com.pitcherx.dto.area.AreaRequestDTO;
import com.pitcherx.dto.area.AreaResponseDTO;
import com.pitcherx.mapper.AreaMapper;
import com.pitcherx.model.Area;
import com.pitcherx.repository.AreaRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AreaService {

    private final AreaRepository areaRepository;
    private final AreaMapper areaMapper;

    public AreaService(AreaRepository areaRepository, AreaMapper areaMapper){
        this.areaRepository = areaRepository;
        this.areaMapper = areaMapper;
    }

    @Transactional(readOnly = true)
    public List<AreaResponseDTO> listarAreas(){
        return areaRepository.findAll().stream()
                .map(areaMapper::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public AreaResponseDTO buscarAreaPorId(Long idArea){
        Area area = areaRepository.findById(idArea).orElseThrow(() -> new EntityNotFoundException("Sem area com o ID informado!"));
        return areaMapper.toDTO(area);
    }

    @Transactional
    public AreaResponseDTO criarArea(AreaRequestDTO areaRequestDTO){

        if (areaRepository.existsByNomeArea(areaRequestDTO.nomeArea())){
            throw new IllegalArgumentException("Já existe uma área com esse nome!");
        }

        Area area = areaMapper.toEntity(areaRequestDTO);

        Area salvo = areaRepository.save(area);
        return areaMapper.toDTO(salvo);
    }

    @Transactional
    public AreaResponseDTO atualizarArea(Long idArea, AreaRequestDTO areaRequestDTO){
        Area area = areaRepository.findById(idArea).orElseThrow(() -> new EntityNotFoundException("Sem area com o ID informado!"));

        if (areaRepository.existsByNomeAreaAndIdAreaNot(areaRequestDTO.nomeArea(), idArea)){
            throw new IllegalArgumentException("Já existe uma área com esse nome!");
        }

        areaMapper.updateFromDTO(areaRequestDTO, area);

        Area salvo = areaRepository.save(area);
        return areaMapper.toDTO(salvo);
    }

    @Transactional
    public void deletarArea(Long idArea){
        if (!areaRepository.existsById(idArea)){
            throw new EntityNotFoundException("Sem area com o ID informado!");
        }

        try {
            areaRepository.deleteById(idArea);
        }catch (DataIntegrityViolationException e) {
            throw new IllegalArgumentException("Não é possível deletar esta área, pois ela está associada a outras entidades.");
        }

    }

}
