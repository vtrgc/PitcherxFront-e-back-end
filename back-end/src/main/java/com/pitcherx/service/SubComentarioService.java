package com.pitcherx.service;

import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pitcherx.dto.subComentario.SubComentarioRequestDTO;
import com.pitcherx.dto.subComentario.SubComentarioResponseDTO;
import com.pitcherx.mapper.SubComentarioMapper;
import com.pitcherx.model.Comentario;
import com.pitcherx.model.SubComentario;
import com.pitcherx.model.Usuario;
import com.pitcherx.repository.ComentarioRepository;
import com.pitcherx.repository.SubComentarioRepository;
import com.pitcherx.repository.UsuarioRepository;

import jakarta.persistence.EntityNotFoundException;

@Service
public class SubComentarioService {

	private final SubComentarioRepository subComentarioRepository;
	private final SubComentarioMapper subComentarioMapper;
	private final ComentarioRepository comentarioRepository;
	private final UsuarioRepository usuarioRepository;
	
	public SubComentarioService(SubComentarioRepository subComentarioRepository, SubComentarioMapper subComentarioMapper, ComentarioRepository comentarioRepository,
			UsuarioRepository usuarioRepository) {
		this.subComentarioRepository = subComentarioRepository;
		this.subComentarioMapper = subComentarioMapper;
		this.comentarioRepository = comentarioRepository;
		this.usuarioRepository = usuarioRepository;
	}
	
	@Transactional(readOnly = true)
	public List<SubComentarioResponseDTO> listarSubComentarios(){
		return subComentarioRepository.findAll().stream()
				.map(subComentarioMapper::toDTO)
				.toList();
	}
	
	@Transactional(readOnly = true)
	public SubComentarioResponseDTO buscarSubComentarioPorId(Long idSubComentario) {
		SubComentario subComentario = subComentarioRepository.findById(idSubComentario)
				.orElseThrow(() -> new EntityNotFoundException("Sem sub-comentario com o ID informado!"));
		return subComentarioMapper.toDTO(subComentario);
	}
	
	@Transactional
	public SubComentarioResponseDTO criarSubComentario(SubComentarioRequestDTO subComentarioRequestDTO) {
		Comentario comentario = comentarioRepository.findById(subComentarioRequestDTO.comentarioId())
				.orElseThrow(() -> new EntityNotFoundException("Sem comentario com o ID informado!"));
		
		Usuario usuario = usuarioRepository.findById(subComentarioRequestDTO.usuarioId())
				.orElseThrow(() -> new EntityNotFoundException("Sem usuário com o ID informado!"));
		
		SubComentario subComentario = subComentarioMapper.toEntity(subComentarioRequestDTO);
		subComentario.setComentario(comentario);
		subComentario.setUsuario(usuario);
		
		SubComentario salvo = subComentarioRepository.save(subComentario);
		return subComentarioMapper.toDTO(salvo);
	}
	
	@Transactional
	public SubComentarioResponseDTO atualizarSubComentario(Long idSubComentario, SubComentarioRequestDTO subComentarioRequestDTO) {
		SubComentario subComentario = subComentarioRepository.findById(idSubComentario)
				.orElseThrow(() -> new EntityNotFoundException("Sem sub comentario com o ID informado!"));
		
		Comentario comentario = comentarioRepository.findById(subComentarioRequestDTO.comentarioId())
				.orElseThrow(() -> new EntityNotFoundException("Sem comentario com o ID informado!"));
		
		Usuario usuario = usuarioRepository.findById(subComentarioRequestDTO.usuarioId())
				.orElseThrow(() -> new EntityNotFoundException("Sem usuário com o ID informado!"));
		
		subComentarioMapper.toUpdate(subComentarioRequestDTO, subComentario);
		subComentario.setComentario(comentario);
		subComentario.setUsuario(usuario);
		
		SubComentario salvo = subComentarioRepository.save(subComentario);
		return subComentarioMapper.toDTO(salvo);
	}
	
	@Transactional
	public void deletarSubComentario(Long idSubComentario) {
		if (!subComentarioRepository.existsById(idSubComentario)) {
			throw new EntityNotFoundException("Sem sub comentario com o ID informado!");
		}
		try {
			subComentarioRepository.deleteById(idSubComentario);
		} catch (DataIntegrityViolationException e) {
            throw new IllegalStateException("Não é possível deletar o sub comentario, pois ele está associada a outras entidades.!");
		}
	}
	
}
