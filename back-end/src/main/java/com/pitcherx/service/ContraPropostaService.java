package com.pitcherx.service;

import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pitcherx.dto.contraProposta.ContraPropostaRequestDTO;
import com.pitcherx.dto.contraProposta.ContraPropostaResponseDTO;
import com.pitcherx.mapper.ContraPropostaMapper;
import com.pitcherx.model.ContraProposta;
import com.pitcherx.model.Proposta;
import com.pitcherx.repository.ContraPropostaRepository;
import com.pitcherx.repository.PropostaRepository;

import jakarta.persistence.EntityNotFoundException;

@Service
public class ContraPropostaService {

	private final ContraPropostaRepository contraPropostaRepository;
	private final ContraPropostaMapper contraPropostaMapper;
	private final PropostaRepository propostaRepository;
	
	public ContraPropostaService(ContraPropostaRepository contraPropostaRepository, ContraPropostaMapper contraPropostaMapper,
			PropostaRepository propostaRepository) {
		this.contraPropostaRepository = contraPropostaRepository;
		this.contraPropostaMapper = contraPropostaMapper;
		this.propostaRepository = propostaRepository;
	}
	
	@Transactional(readOnly = true)
	public List<ContraPropostaResponseDTO> listarContraPropostas(){
		return contraPropostaRepository.findAll().stream()
				.map(contraPropostaMapper::toDTO)
				.toList();
	}
	
	@Transactional(readOnly = true)
	public ContraPropostaResponseDTO buscarContraPropostaPorId(Long idContraProposta) {
		ContraProposta contraProposta = contraPropostaRepository.findById(idContraProposta)
				.orElseThrow(() -> new EntityNotFoundException("Sem contra proposta com o ID informado."));
		return contraPropostaMapper.toDTO(contraProposta);
	}
	
	@Transactional
	public ContraPropostaResponseDTO criarContraProposta(ContraPropostaRequestDTO contraPropostaRequestDTO) {
		Proposta proposta = propostaRepository.findById(contraPropostaRequestDTO.idProposta())
				.orElseThrow(() -> new EntityNotFoundException("Sem proposta com o ID informado"));
		
		ContraProposta contraProposta = contraPropostaMapper.toEntity(contraPropostaRequestDTO);
		contraProposta.setProposta(proposta);
		
		ContraProposta salvo = contraPropostaRepository.save(contraProposta);
		return contraPropostaMapper.toDTO(salvo);
		
	}
	
	@Transactional
	public ContraPropostaResponseDTO atualizarContraProposta(Long idContraProposta, ContraPropostaRequestDTO contraPropostaRequestDTO) {
		ContraProposta contraProposta = contraPropostaRepository.findById(idContraProposta)
				.orElseThrow(() -> new EntityNotFoundException("Sem contra proposta com o ID informado."));
		
		Proposta proposta = propostaRepository.findById(contraPropostaRequestDTO.idProposta())
				.orElseThrow(() -> new EntityNotFoundException("Sem proposta com o ID informado"));
		
		contraPropostaMapper.toUpdate(contraPropostaRequestDTO, contraProposta);
		contraProposta.setProposta(proposta);
		
		ContraProposta salvo = contraPropostaRepository.save(contraProposta);
		return contraPropostaMapper.toDTO(salvo);
	}
	
	@Transactional
	public void deletarContraProposta(Long idContraProposta) {
		if (!contraPropostaRepository.existsById(idContraProposta)) {
			throw new EntityNotFoundException("Sem contra proposta com o ID informado.");
		}
		try {
			contraPropostaRepository.deleteById(idContraProposta);
		} catch (DataIntegrityViolationException e) {
            throw new IllegalStateException("Não é possível deletara contra proposta, pois ela está associada a outras entidades.!");
		}
	}
	
}
