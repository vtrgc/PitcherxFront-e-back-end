package com.pitcherx.service;

import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pitcherx.dto.endereco.EnderecoRequestDTO;
import com.pitcherx.dto.endereco.EnderecoResponseDTO;
import com.pitcherx.mapper.EnderecoMapper;
import com.pitcherx.model.Endereco;
import com.pitcherx.model.Usuario;
import com.pitcherx.repository.EnderecoRepository;
import com.pitcherx.repository.UsuarioRepository;

import jakarta.persistence.EntityNotFoundException;

@Service
public class EnderecoService {

	private final EnderecoRepository enderecoRepository;
	private final EnderecoMapper enderecoMapper;
	private final UsuarioRepository usuarioRepository;
	
	public EnderecoService(EnderecoRepository enderecoRepository, EnderecoMapper enderecoMapper,
			UsuarioRepository usuarioRepository) {
		this.enderecoRepository = enderecoRepository;
		this.enderecoMapper = enderecoMapper;
		this.usuarioRepository = usuarioRepository;
	}
	
	@Transactional(readOnly = true)
	public List<EnderecoResponseDTO> listarEndereco(){
		return enderecoRepository.findAll().stream()
				.map(enderecoMapper::toDTO)
				.toList();
	}
	
	@Transactional(readOnly = true)
	public EnderecoResponseDTO buscarEnderecoPorId(Long idEndereco) {
		Endereco endereco = enderecoRepository.findById(idEndereco)
				.orElseThrow(() -> new EntityNotFoundException("Sem endereço com o ID informado!"));
		return enderecoMapper.toDTO(endereco);
	}
	
	@Transactional
	public EnderecoResponseDTO criarEndereco(EnderecoRequestDTO enderecoRequestDTO) {
        Usuario usuario = usuarioRepository.findById(enderecoRequestDTO.usuarioId())
        		.orElseThrow(() -> new EntityNotFoundException("Sem usuário com o ID informado!"));

		Endereco endereco = enderecoMapper.toEntity(enderecoRequestDTO);
		endereco.setUsuario(usuario);
		
		Endereco salvo = enderecoRepository.save(endereco);
		return enderecoMapper.toDTO(salvo);
	}
	
	@Transactional
	public EnderecoResponseDTO atualizarEndereco(Long idEndereco, EnderecoRequestDTO enderecoRequestDTO) {
		Endereco endereco = enderecoRepository.findById(idEndereco)
				.orElseThrow(() -> new IllegalArgumentException("Sem endereço com o ID informado!"));
		
		Usuario usuario = usuarioRepository.findById(enderecoRequestDTO.usuarioId())
	        	.orElseThrow(() -> new EntityNotFoundException("Sem usuário com o ID informado!"));

		
		enderecoMapper.toUpdate(enderecoRequestDTO, endereco);
		endereco.setUsuario(usuario);
		
		Endereco salvo = enderecoRepository.save(endereco);
		return enderecoMapper.toDTO(salvo);
	}
	
	@Transactional
	public void deletarEndereco(Long idEndereco) {
		if (!enderecoRepository.existsById(idEndereco)) {
			throw new EntityNotFoundException("Sem endereço com o ID informado!");
		}
		try {
			enderecoRepository.deleteById(idEndereco);
		} catch (DataIntegrityViolationException e) {
            throw new IllegalStateException("Não é possível deletar o endereço, pois ela está associada a outras entidades!");
		}
	}
	
}
