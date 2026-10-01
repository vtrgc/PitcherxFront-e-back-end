package com.pitcherx.service;

import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pitcherx.dto.proposta.PropostaRequestDTO;
import com.pitcherx.dto.proposta.PropostaResponseDTO;
import com.pitcherx.mapper.PropostaMapper;
import com.pitcherx.model.Proposta;
import com.pitcherx.repository.PropostaRepository;

import jakarta.persistence.EntityNotFoundException;

@Service
public class PropostaService {

	private final PropostaRepository propostaRepository;
	private final PropostaMapper propostaMapper;
	
	public PropostaService(PropostaRepository propostaRepository, PropostaMapper propostaMapper) {
		this.propostaRepository = propostaRepository;
		this.propostaMapper = propostaMapper;
	}
	
	@Transactional(readOnly = true)
	public List<PropostaResponseDTO> listarPropostas(){
		return propostaRepository.findAll().stream()
				.map(propostaMapper::toDTO)
				.toList();
	}
	
	@Transactional(readOnly = true)
	public PropostaResponseDTO buscarPropostaPorId(Long idProposta) {
		Proposta proposta = propostaRepository.findById(idProposta)
			.orElseThrow(() -> new EntityNotFoundException("Sem proposta com o ID informado!"));
		return propostaMapper.toDTO(proposta);
	}
	
	@Transactional
	public PropostaResponseDTO criarProposta(PropostaRequestDTO propostaRequestDTO) {
		
		Proposta proposta = propostaMapper.toEntity(propostaRequestDTO);
		
		Proposta salvo = propostaRepository.save(proposta);
		return propostaMapper.toDTO(salvo);
	}
	
	@Transactional
	public PropostaResponseDTO atualizarProposta(Long idProposta, PropostaRequestDTO propostaRequestDTO) {
		Proposta proposta = propostaRepository.findById(idProposta)
				.orElseThrow(() -> new EntityNotFoundException("Sem proposta com o ID informado!"));
		
		propostaMapper.toUpdate(propostaRequestDTO, proposta);
		
		Proposta salvo = propostaRepository.save(proposta);
		return propostaMapper.toDTO(salvo);
	}
	
	@Transactional
	public void deletarProposta(Long idProposta) {
		if(!propostaRepository.existsById(idProposta)) {
			throw new EntityNotFoundException("Sem proposta com o ID informado!");
		}
		try {
			propostaRepository.deleteById(idProposta);
		} catch (DataIntegrityViolationException e) {
            throw new IllegalArgumentException("Não é possível deletar esta proposta, pois ela está associada a outras entidades.");
		}
	}
	
}
