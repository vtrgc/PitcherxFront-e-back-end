package com.pitcherx.service;

import com.pitcherx.security.Permissoes;
import org.springframework.beans.factory.annotation.Autowired;
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

	@Autowired
	private Permissoes permissoes;

	/**
	 * Endereço completo só para o dono e o administrador; para os demais, apenas a UF
	 * (o perfil público mostra o estado). Antes, GET /endereco expunha o endereço de todos.
	 */
	private EnderecoResponseDTO paraLeitura(Endereco endereco) {
		EnderecoResponseDTO dto = enderecoMapper.toDTO(endereco);
		boolean dono = false;
		try {
			dono = permissoes.isAdmin() || (endereco.getUsuario() != null
					&& java.util.Objects.equals(endereco.getUsuario().getIdUsuario(), permissoes.idUsuarioAtual()));
		} catch (org.springframework.security.access.AccessDeniedException e) {
			dono = false;
		}
		if (dono) return dto;
		return new EnderecoResponseDTO(dto.idEndereco(), null, dto.uf(), null, null, null, null, dto.usuarioId());
	}
	
	public EnderecoService(EnderecoRepository enderecoRepository, EnderecoMapper enderecoMapper,
			UsuarioRepository usuarioRepository) {
		this.enderecoRepository = enderecoRepository;
		this.enderecoMapper = enderecoMapper;
		this.usuarioRepository = usuarioRepository;
	}
	
	@Transactional(readOnly = true)
	public List<EnderecoResponseDTO> listarEndereco(){
		return enderecoRepository.findAll().stream()
				.map(this::paraLeitura)
				.toList();
	}
	
	@Transactional(readOnly = true)
	public EnderecoResponseDTO buscarEnderecoPorId(Long idEndereco) {
		Endereco endereco = enderecoRepository.findById(idEndereco)
				.orElseThrow(() -> new EntityNotFoundException("Sem endereço com o ID informado!"));
		return paraLeitura(endereco);
	}
	
	@Transactional
	public EnderecoResponseDTO criarEndereco(EnderecoRequestDTO enderecoRequestDTO) {
		permissoes.exigirProprioOuAdmin(enderecoRequestDTO.usuarioId(), "Você só pode cadastrar o seu próprio endereço.");
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
				.orElseThrow(() -> new EntityNotFoundException("Sem endereço com o ID informado!"));
		permissoes.exigirProprioOuAdmin(endereco.getUsuario().getIdUsuario(), "Você só pode alterar o seu próprio endereço.");
		// O dono do endereço não muda na edição.
		Usuario usuario = endereco.getUsuario();

		
		enderecoMapper.toUpdate(enderecoRequestDTO, endereco);
		endereco.setUsuario(usuario);
		
		Endereco salvo = enderecoRepository.save(endereco);
		return enderecoMapper.toDTO(salvo);
	}
	
	@Transactional
	public void deletarEndereco(Long idEndereco) {
		Endereco existente = enderecoRepository.findById(idEndereco)
				.orElseThrow(() -> new EntityNotFoundException("Sem endereço com o ID informado!"));
		permissoes.exigirProprioOuAdmin(existente.getUsuario().getIdUsuario(), "Você só pode excluir o seu próprio endereço.");
		try {
			enderecoRepository.deleteById(idEndereco);
		} catch (DataIntegrityViolationException e) {
            throw new IllegalStateException("Não é possível deletar o endereço, pois ela está associada a outras entidades!");
		}
	}
	
}
