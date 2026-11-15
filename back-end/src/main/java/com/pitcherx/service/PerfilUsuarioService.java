package com.pitcherx.service;

import com.pitcherx.security.Permissoes;
import org.springframework.beans.factory.annotation.Autowired;
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
import com.pitcherx.utils.UploadUtil;

import jakarta.persistence.EntityNotFoundException;
import com.pitcherx.exceptions.BusinessException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.multipart.MultipartFile;

@Service
public class PerfilUsuarioService {

	private final PerfilUsuarioRepository perfilUsuarioRepository;
	private final PerfilUsuarioMapper perfilUsuarioMapper;
	private final EspecialidadeRepository especialidadeRepository;
	private final UploadUtil uploadUtil;

	@Autowired
	private Permissoes permissoes;
	
	public PerfilUsuarioService(PerfilUsuarioRepository perfilUsuarioRepository, PerfilUsuarioMapper perfilUsuarioMapper,
			EspecialidadeRepository especialidadeRepository, UploadUtil uploadUtil) {
		this.perfilUsuarioRepository = perfilUsuarioRepository;
		this.perfilUsuarioMapper = perfilUsuarioMapper;
		this.especialidadeRepository = especialidadeRepository;
		this.uploadUtil = uploadUtil;
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
		permissoes.exigirProprioOuAdmin(perfilUsuarioRequestDTO.idUsuario(), "Você só pode criar o seu próprio perfil.");
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
		Long dono = perfilUsuario.getUsuario().getIdUsuario();
		permissoes.exigirProprioOuAdmin(dono, "Você só pode alterar o seu próprio perfil.");
		// O mapper copia "idUsuario" para usuario.idUsuario: trocar o dono alteraria o id do usuário.
		if (!java.util.Objects.equals(perfilUsuarioRequestDTO.idUsuario(), dono)) {
			throw new BusinessException("O perfil não pode ser transferido para outro usuário.", "PERFIL_DONO_IMUTAVEL");
		}
		
		Especialidade especialidade = especialidadeRepository.findById(perfilUsuarioRequestDTO.idEspecialidade())
				.orElseThrow(() -> new EntityNotFoundException("Sem especialidade com o ID informado!"));
		
		// Capa e vídeo têm endpoints próprios: um PUT sem eles não pode apagá-los.
		String bannerAtual = perfilUsuario.getUrlBanner();
		String videoAtual = perfilUsuario.getUrlVideoPerfil();
		perfilUsuarioMapper.updateFromDTO(perfilUsuarioRequestDTO, perfilUsuario);
		if (perfilUsuarioRequestDTO.urlBanner() == null) perfilUsuario.setUrlBanner(bannerAtual);
		if (perfilUsuarioRequestDTO.urlVideoPerfil() == null) perfilUsuario.setUrlVideoPerfil(videoAtual);
		perfilUsuario.setEspecialidade(especialidade);
		
		PerfilUsuario salvo = perfilUsuarioRepository.save(perfilUsuario);
		return perfilUsuarioMapper.toDTO(salvo);
	}
	
	@Transactional
	public void deletarPerfilUsuario(Long idPerfilUsuario) {
		PerfilUsuario perfilUsuario = perfilUsuarioRepository.findById(idPerfilUsuario)
				.orElseThrow(() -> new EntityNotFoundException("Sem perfil de usuário com o ID informado!"));
		permissoes.exigirProprioOuAdmin(perfilUsuario.getUsuario().getIdUsuario(), "Você só pode excluir o seu próprio perfil.");
		try {
			perfilUsuarioRepository.delete(perfilUsuario);
			uploadUtil.limparAposTransacaoImagens(
					perfilUsuario.getUrlBanner() == null ? List.of() : List.of(perfilUsuario.getUrlBanner()),
					List.of());
			uploadUtil.limparAposTransacaoVideos(
					perfilUsuario.getUrlVideoPerfil() == null ? List.of() : List.of(perfilUsuario.getUrlVideoPerfil()),
					List.of());
		} catch (DataIntegrityViolationException e) {
			throw new IllegalArgumentException("Não é possível deletar este perfil de usuário, pois ele está associado a outras entidades.");
		}
	}

	@Transactional
	public PerfilUsuarioResponseDTO atualizarBanner(Long idPerfilUsuario, Usuario usuarioLogado, MultipartFile arquivo) {
		PerfilUsuario perfilUsuario = buscarPerfilComPermissao(idPerfilUsuario, usuarioLogado);
		String urlAnterior = perfilUsuario.getUrlBanner();
		String novaUrl = uploadUtil.salvarImagem(arquivo);
		uploadUtil.limparAposTransacaoImagens(
				urlAnterior == null ? List.of() : List.of(urlAnterior),
				List.of(novaUrl));
		perfilUsuario.setUrlBanner(novaUrl);
		return perfilUsuarioMapper.toDTO(perfilUsuarioRepository.save(perfilUsuario));
	}

	@Transactional
	public void removerBanner(Long idPerfilUsuario, Usuario usuarioLogado) {
		PerfilUsuario perfilUsuario = buscarPerfilComPermissao(idPerfilUsuario, usuarioLogado);
		String urlAnterior = perfilUsuario.getUrlBanner();
		uploadUtil.limparAposTransacaoImagens(
				urlAnterior == null ? List.of() : List.of(urlAnterior),
				List.of());
		perfilUsuario.setUrlBanner(null);
		perfilUsuarioRepository.save(perfilUsuario);
	}

	@Transactional
	public PerfilUsuarioResponseDTO atualizarVideo(Long idPerfilUsuario, Usuario usuarioLogado, MultipartFile arquivo) {
		PerfilUsuario perfilUsuario = buscarPerfilComPermissao(idPerfilUsuario, usuarioLogado);
		String urlAnterior = perfilUsuario.getUrlVideoPerfil();
		String novaUrl = uploadUtil.salvarVideo(arquivo);
		uploadUtil.limparAposTransacaoVideos(
				urlAnterior == null ? List.of() : List.of(urlAnterior),
				List.of(novaUrl));
		perfilUsuario.setUrlVideoPerfil(novaUrl);
		return perfilUsuarioMapper.toDTO(perfilUsuarioRepository.save(perfilUsuario));
	}

	@Transactional
	public void removerVideo(Long idPerfilUsuario, Usuario usuarioLogado) {
		PerfilUsuario perfilUsuario = buscarPerfilComPermissao(idPerfilUsuario, usuarioLogado);
		String urlAnterior = perfilUsuario.getUrlVideoPerfil();
		uploadUtil.limparAposTransacaoVideos(
				urlAnterior == null ? List.of() : List.of(urlAnterior),
				List.of());
		perfilUsuario.setUrlVideoPerfil(null);
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
