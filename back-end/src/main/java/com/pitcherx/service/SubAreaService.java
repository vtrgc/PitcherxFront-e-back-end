package com.pitcherx.service;

import com.pitcherx.dto.subArea.SubAreaRequestDTO;
import com.pitcherx.dto.subArea.SubAreaResponseDTO;
import com.pitcherx.mapper.SubAreaMapper;
import com.pitcherx.model.Area;
import com.pitcherx.model.SubArea;
import com.pitcherx.repository.AreaRepository;
import com.pitcherx.repository.SubAreaRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SubAreaService {

    private final SubAreaRepository subAreaRepository;
    private final SubAreaMapper subAreaMapper;
    private final AreaRepository areaRepository;

    public SubAreaService(SubAreaRepository subAreaRepository, SubAreaMapper subAreaMapper, AreaRepository areaRepository) {
        this.subAreaRepository = subAreaRepository;
        this.subAreaMapper = subAreaMapper;
        this.areaRepository = areaRepository;
    }

    @Transactional(readOnly = true)
    public List<SubAreaResponseDTO> listarSubAreas(){
        return subAreaRepository.findAll().stream()
                .map(subAreaMapper::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public SubAreaResponseDTO buscarSubAreaPorId(Long idSubArea) {
        SubArea subArea = subAreaRepository.findById(idSubArea)
                .orElseThrow(() -> new EntityNotFoundException("Sem subárea com o ID informado!"));
        return subAreaMapper.toDTO(subArea);
    }

    @Transactional
    public SubAreaResponseDTO salvarSubArea(SubAreaRequestDTO subAreaRequestDTO){

        if (subAreaRepository.existsSubAreaByNomeSubArea(subAreaRequestDTO.nomeSubArea())){
            throw new IllegalArgumentException("Já existe uma subárea com esse nome!");
        }

        Area area = areaRepository.findById(subAreaRequestDTO.idArea())
                .orElseThrow(() -> new EntityNotFoundException("Sem área com o ID informado!"));

        SubArea subArea = subAreaMapper.toEntity(subAreaRequestDTO);
        subArea.setArea(area);

        SubArea salvo = subAreaRepository.save(subArea);
        return subAreaMapper.toDTO(salvo);

    }

    @Transactional
    public SubAreaResponseDTO atualizarSubArea(Long idSubArea, SubAreaRequestDTO subAreaRequestDTO){
        SubArea subArea = subAreaRepository.findById(idSubArea)
                .orElseThrow(() -> new EntityNotFoundException("Sem subárea com o ID informado!"));

        if (subAreaRepository.existsSubAreaByNomeSubAreaAndIdSubAreaNot(subAreaRequestDTO.nomeSubArea(), idSubArea)){
            throw new IllegalArgumentException("Já existe uma subárea com esse nome!");
        }

        Area area = areaRepository.findById(subAreaRequestDTO.idArea())
                .orElseThrow(() -> new EntityNotFoundException("Sem área com o ID informado!"));

        subAreaMapper.updateEntityFromDTO(subAreaRequestDTO, subArea);
        subArea.setArea(area);

        SubArea salvo = subAreaRepository.save(subArea);
        return subAreaMapper.toDTO(salvo);
    }

    @Transactional
    public void deletarSubArea(Long idSubArea){
        if(!subAreaRepository.existsById(idSubArea)){
            throw new EntityNotFoundException("Sem subárea com o ID informado!");
        }
        try {
            subAreaRepository.deleteById(idSubArea);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalStateException("Não foi possível deletar a subárea. pois ela está associada a outras entidades!");
        }
    }

}
