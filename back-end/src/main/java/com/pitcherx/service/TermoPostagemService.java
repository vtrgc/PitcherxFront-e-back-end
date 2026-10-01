package com.pitcherx.service;

import com.pitcherx.dto.termoPostagem.TermoPostagemRequestDTO;
import com.pitcherx.dto.termoPostagem.TermoPostagemResponseDTO;
import com.pitcherx.mapper.TermoPostagemMapper;
import com.pitcherx.model.TermoPostagem;
import com.pitcherx.repository.TermoPostagemRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TermoPostagemService {

    private final TermoPostagemRepository termoPostagemRepository;
    private final TermoPostagemMapper termoPostagemMapper;

    public TermoPostagemService(TermoPostagemRepository termoPostagemRepository, TermoPostagemMapper termoPostagemMapper) {
        this.termoPostagemRepository = termoPostagemRepository;
        this.termoPostagemMapper = termoPostagemMapper;
    }

    @Transactional(readOnly = true)
    public List<TermoPostagemResponseDTO> listarTermosPostagem(){
        return termoPostagemRepository.findAll().stream()
                .map(termoPostagemMapper::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public TermoPostagemResponseDTO buscarTermoPostagemPorId(Long id){
        TermoPostagem termoPostagem = termoPostagemRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Sem termo de postagem com o ID informado!"));
        return termoPostagemMapper.toDTO(termoPostagem);
    }

    @Transactional
    public TermoPostagemResponseDTO criarTermoPostagem(TermoPostagemRequestDTO termoPostagemRequestDTO){
        if (termoPostagemRepository.existsByTituloTermoPostagem(termoPostagemRequestDTO.tituloTermoPostagem())){
            throw new IllegalArgumentException("Já existe um termo de postagem com esse título!");
        }

        TermoPostagem termoPostagem = termoPostagemMapper.toEntity(termoPostagemRequestDTO);

        TermoPostagem salvo = termoPostagemRepository.save(termoPostagem);
        return termoPostagemMapper.toDTO(salvo);
    }

    @Transactional
    public TermoPostagemResponseDTO atualizarTermoPostagem(Long idTermoPostagem, TermoPostagemRequestDTO termoPostagemRequestDTO){
        TermoPostagem termoPostagem = termoPostagemRepository.findById(idTermoPostagem)
                .orElseThrow(() -> new EntityNotFoundException("Sem termo de postagem com o ID informado!"));

        if (termoPostagemRepository.existsByTituloTermoPostagemAndIdTermoPostagemNot(termoPostagemRequestDTO.tituloTermoPostagem(), idTermoPostagem)){
            throw new IllegalArgumentException("Já existe um termo de postagem com esse título!");
        }

        termoPostagemMapper.updateFromDTO(termoPostagemRequestDTO, termoPostagem);

        TermoPostagem salvo = termoPostagemRepository.save(termoPostagem);
        return termoPostagemMapper.toDTO(salvo);
    }

    @Transactional
    public void deletarTermoPostagem(Long idTermoPostagem){
        if (!termoPostagemRepository.existsById(idTermoPostagem)){
            throw new EntityNotFoundException("Sem termo de postagem com o ID informado!");
        }
        try {
            termoPostagemRepository.deleteById(idTermoPostagem);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalStateException("Não é possível deletar o termo de postagem, pois ele está associada a outras entidades!");
        }
    }

}
