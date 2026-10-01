package com.pitcherx.service;

import com.pitcherx.dto.especialidade.EspecialidadeRequestDTO;
import com.pitcherx.dto.especialidade.EspecialidadeResponseDTO;
import com.pitcherx.mapper.EspecialidadeMapper;
import com.pitcherx.model.Especialidade;
import com.pitcherx.repository.EspecialidadeRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EspecialidadeService {

    private final EspecialidadeRepository especialidadeRepository;
    private final EspecialidadeMapper especialidadeMapper;

    public EspecialidadeService(EspecialidadeRepository especialidadeRepository, EspecialidadeMapper especialidadeMapper) {
        this.especialidadeRepository = especialidadeRepository;
        this.especialidadeMapper = especialidadeMapper;
    }

    @Transactional(readOnly = true)
    public List<EspecialidadeResponseDTO> listarEspecialidades(){
        return especialidadeRepository.findAll().stream()
                .map(especialidadeMapper::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public EspecialidadeResponseDTO buscarEspecialidadePorId(Long idEspecialidade){
        Especialidade especialidade = especialidadeRepository.findById(idEspecialidade)
                .orElseThrow(() -> new EntityNotFoundException("Sem especialidade com o ID informado!"));
        return especialidadeMapper.toDTO(especialidade);
    }

    @Transactional
    public EspecialidadeResponseDTO criarEspecialidade(EspecialidadeRequestDTO especialidadeRequestDTO){
        if (especialidadeRepository.existsByNomeEspecialidade(especialidadeRequestDTO.nomeEspecialidade())){
            throw new IllegalArgumentException("Já existe uma especialidade com esse nome!");
        }

        Especialidade especialidade = especialidadeMapper.toEntity(especialidadeRequestDTO);

        Especialidade salvo = especialidadeRepository.save(especialidade);
        return especialidadeMapper.toDTO(salvo);
    }

    @Transactional
    public EspecialidadeResponseDTO atualizarEspecialidade(Long idEspecialidade, EspecialidadeRequestDTO especialidadeRequestDTO){
        Especialidade especialidade = especialidadeRepository.findById(idEspecialidade)
                .orElseThrow(() -> new EntityNotFoundException("Sem especialidade com o ID informado!"));

        if (especialidadeRepository.existsByNomeEspecialidadeAndIdEspecialidadeNot(especialidadeRequestDTO.nomeEspecialidade(), idEspecialidade)){
            throw new IllegalArgumentException("Já existe uma especialidade com esse nome!");
        }

        especialidadeMapper.updateFromDTO(especialidadeRequestDTO, especialidade);

        Especialidade salvo = especialidadeRepository.save(especialidade);
        return especialidadeMapper.toDTO(salvo);
    }

    @Transactional
    public void deletarEspecialidade(Long idEspecialidade){
        if(!especialidadeRepository.existsById(idEspecialidade)){
            throw new EntityNotFoundException("Sem especialidade com o ID informado!");
        }

        try {
            especialidadeRepository.deleteById(idEspecialidade);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalStateException("Não é possível deletar a especialidade, pois ela está associada a outras entidades!");
        }
    }

    public EspecialidadeResponseDTO toReponse(Especialidade especialidade){
        return new EspecialidadeResponseDTO(
                especialidade.getIdEspecialidade(),
                especialidade.getNomeEspecialidade()
        );
    }
}
