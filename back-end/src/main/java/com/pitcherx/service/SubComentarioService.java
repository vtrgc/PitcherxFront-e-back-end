package com.pitcherx.service;

import com.pitcherx.security.Permissoes;
import org.springframework.beans.factory.annotation.Autowired;
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

	@Autowired
	private Permissoes permissoes;
	
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
		permissoes.exigirProprio(subComentarioRequestDTO.usuarioId(), "Você só pode responder em seu próprio nome.");
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
		permissoes.exigirProprio(subComentario.getUsuario().getIdUsuario(), "Apenas o autor pode editar esta resposta.");
		Comentario comentario = subComentario.getComentario();
		Usuario usuario = subComentario.getUsuario();
		
		subComentarioMapper.toUpdate(subComentarioRequestDTO, subComentario);
		subComentario.setComentario(comentario);
		subComentario.setUsuario(usuario);
		
		SubComentario salvo = subComentarioRepository.save(subComentario);
		return subComentarioMapper.toDTO(salvo);
	}
	
	@Transactional
	public void deletarSubComentario(Long idSubComentario) {
		SubComentario subComentario = subComentarioRepository.findById(idSubComentario)
				.orElseThrow(() -> new EntityNotFoundException("Sem sub comentario com o ID informado!"));
		permissoes.exigirProprioOuAdmin(subComentario.getUsuario().getIdUsuario(), "Apenas o autor ou um administrador pode excluir esta resposta.");
		try {
			subComentarioRepository.deleteById(idSubComentario);
		} catch (DataIntegrityViolationException e) {
            throw new IllegalStateException("Não é possível deletar o sub comentario, pois ele está associada a outras entidades.!");
		}
	}
	
}
