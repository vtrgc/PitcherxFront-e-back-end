package com.pitcherx.service;

import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pitcherx.dto.perfilUsuario.PerfilUsuarioRequestDTO;
import com.pitcherx.dto.perfilUsuario.PerfilUsuarioResponseDTO;
import com.pitcherx.mapper.PerfilUsuarioMapper;
import com.pitcherx.model.Especialidade;
import com.pitcherx.model.PerfilUsuario;
import com.pitcherx.model.Usuario;
import com.pitcherx.repository.EspecialidadeRepository;
import com.pitcherx.repository.PerfilUsuarioRepository;
import com.pitcherx.utils.ImagemUploadUtil;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.multipart.MultipartFile;

@Service
public class PerfilUsuarioService {

	private final PerfilUsuarioRepository perfilUsuarioRepository;
	private final PerfilUsuarioMapper perfilUsuarioMapper;
	private final EspecialidadeRepository especialidadeRepository;
	private final ImagemUploadUtil imagemUploadUtil;
	
	public PerfilUsuarioService(PerfilUsuarioRepository perfilUsuarioRepository, PerfilUsuarioMapper perfilUsuarioMapper,
			EspecialidadeRepository especialidadeRepository, ImagemUploadUtil imagemUploadUtil) {
		this.perfilUsuarioRepository = perfilUsuarioRepository;
		this.perfilUsuarioMapper = perfilUsuarioMapper;
		this.especialidadeRepository = especialidadeRepository;
		this.imagemUploadUtil = imagemUploadUtil;
	}
	
	@Transactional(readOnly = true)
	public List<PerfilUsuarioResponseDTO> listarPerfilsUsuario(){
		return perfilUsuarioRepository.findAll().stream()
				.map(perfilUsuarioMapper::toDTO)
				.toList();
	}
	
	@Transactional(readOnly = true)
	public PerfilUsuarioResponseDTO buscarPerfilUsuarioPorId(Long idPerfilUsuario) {
		PerfilUsuario perfilUsuario = perfilUsuarioRepository.findById(idPerfilUsuario)
				.orElseThrow(() -> new EntityNotFoundException("Sem perfil de usuário com o ID informado!"));
		return perfilUsuarioMapper.toDTO(perfilUsuario);
	}
	
	@Transactional
	public PerfilUsuarioResponseDTO criarPerfilUsuario(PerfilUsuarioRequestDTO perfilUsuarioRequestDTO) {
		Especialidade especialidade = especialidadeRepository.findById(perfilUsuarioRequestDTO.idEspecialidade())
				.orElseThrow(() -> new EntityNotFoundException("Sem especialidade com o ID informado!"));
		
		PerfilUsuario perfilUsuario = perfilUsuarioMapper.toEntity(perfilUsuarioRequestDTO);
		perfilUsuario.setEspecialidade(especialidade);
		
		PerfilUsuario salvo = perfilUsuarioRepository.save(perfilUsuario);
		return perfilUsuarioMapper.toDTO(salvo);
	}
	
	@Transactional
	public PerfilUsuarioResponseDTO atualizarPerfilUsuario(Long idPerfilUsuario, PerfilUsuarioRequestDTO perfilUsuarioRequestDTO) {
		PerfilUsuario perfilUsuario = perfilUsuarioRepository.findById(idPerfilUsuario)
				.orElseThrow(() -> new EntityNotFoundException("Sem perfil de usuário com o ID informado!"));
		
		Especialidade especialidade = especialidadeRepository.findById(perfilUsuarioRequestDTO.idEspecialidade())
				.orElseThrow(() -> new EntityNotFoundException("Sem especialidade com o ID informado!"));
		
		perfilUsuarioMapper.updateFromDTO(perfilUsuarioRequestDTO, perfilUsuario);
		perfilUsuario.setEspecialidade(especialidade);
		
		PerfilUsuario salvo = perfilUsuarioRepository.save(perfilUsuario);
		return perfilUsuarioMapper.toDTO(salvo);
	}
	
	@Transactional
	public void deletarPerfilUsuario(Long idPerfilUsuario) {
		PerfilUsuario perfilUsuario = perfilUsuarioRepository.findById(idPerfilUsuario)
				.orElseThrow(() -> new EntityNotFoundException("Sem perfil de usuário com o ID informado!"));
		try {
			perfilUsuarioRepository.delete(perfilUsuario);
			imagemUploadUtil.limparAposTransacao(
					perfilUsuario.getUrlBanner() == null ? List.of() : List.of(perfilUsuario.getUrlBanner()),
					List.of());
		} catch (DataIntegrityViolationException e) {
			throw new IllegalArgumentException("Não é possível deletar este perfil de usuário, pois ele está associado a outras entidades.");
		}
	}

	@Transactional
	public PerfilUsuarioResponseDTO atualizarBanner(Long idPerfilUsuario, Usuario usuarioLogado, MultipartFile arquivo) {
		PerfilUsuario perfilUsuario = buscarPerfilComPermissao(idPerfilUsuario, usuarioLogado);
		String urlAnterior = perfilUsuario.getUrlBanner();
		String novaUrl = imagemUploadUtil.salvarImagem(arquivo);
		imagemUploadUtil.limparAposTransacao(
				urlAnterior == null ? List.of() : List.of(urlAnterior),
				List.of(novaUrl));
		perfilUsuario.setUrlBanner(novaUrl);
		return perfilUsuarioMapper.toDTO(perfilUsuarioRepository.save(perfilUsuario));
	}

	@Transactional
	public void removerBanner(Long idPerfilUsuario, Usuario usuarioLogado) {
		PerfilUsuario perfilUsuario = buscarPerfilComPermissao(idPerfilUsuario, usuarioLogado);
		String urlAnterior = perfilUsuario.getUrlBanner();
		imagemUploadUtil.limparAposTransacao(
				urlAnterior == null ? List.of() : List.of(urlAnterior),
				List.of());
		perfilUsuario.setUrlBanner(null);
		perfilUsuarioRepository.save(perfilUsuario);
	}

	private PerfilUsuario buscarPerfilComPermissao(Long idPerfilUsuario, Usuario usuarioLogado) {
		PerfilUsuario perfilUsuario = perfilUsuarioRepository.findById(idPerfilUsuario)
				.orElseThrow(() -> new EntityNotFoundException("Sem perfil de usuário com o ID informado!"));
		boolean administrador = usuarioLogado.getAuthorities().stream()
				.map(GrantedAuthority::getAuthority)
				.anyMatch("ROLE_ADMIN"::equals);
		if (!administrador && !perfilUsuario.getUsuario().getIdUsuario().equals(usuarioLogado.getIdUsuario())) {
			throw new SecurityException("Você não tem permissão para alterar este banner.");
		}
		return perfilUsuario;
	}
}
