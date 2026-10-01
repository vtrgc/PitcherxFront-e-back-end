package com.pitcherx.service;

import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pitcherx.dto.postagem.PostagemRequestDTO;
import com.pitcherx.dto.postagem.PostagemResponseDTO;
import com.pitcherx.mapper.PostagemMapper;
import com.pitcherx.model.Postagem;
import com.pitcherx.model.PostagemImagem;
import com.pitcherx.model.Usuario;
import com.pitcherx.repository.PostagemRepository;
import com.pitcherx.repository.UsuarioRepository;
import com.pitcherx.utils.ImagemUploadUtil;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.multipart.MultipartFile;

@Service
public class PostagemService {

	private final PostagemRepository postagemRepository;
	private final PostagemMapper postagemMapper;
	private final UsuarioRepository usuarioRepository;
	private final ImagemUploadUtil imagemUploadUtil;
	
	public PostagemService(PostagemRepository postagemRepository, PostagemMapper postagemMapper,
			UsuarioRepository usuarioRepository, ImagemUploadUtil imagemUploadUtil) {
		this.postagemRepository = postagemRepository;
		this.postagemMapper = postagemMapper;
		this.usuarioRepository = usuarioRepository;
		this.imagemUploadUtil = imagemUploadUtil;
	}
	
	@Transactional(readOnly = true)
	public List<PostagemResponseDTO> listarPostagens(){
		return postagemRepository.findAll().stream()
				.map(postagemMapper::toDTO)
				.toList();
	}
	
	@Transactional(readOnly = true)
	public PostagemResponseDTO buscarPostagemPorId(Long idPostagem) {
		Postagem postagem = postagemRepository.findById(idPostagem)
				.orElseThrow(() -> new EntityNotFoundException("Sem postagem com o ID informado!"));
		return postagemMapper.toDTO(postagem);
	}
	
	@Transactional
	public PostagemResponseDTO criarPostagem(PostagemRequestDTO postagemRequestDTO) {
		Usuario usuario = usuarioRepository.findById(postagemRequestDTO.usuarioId())
				.orElseThrow(() -> new EntityNotFoundException("Sem usuário com o ID informado!"));
		
		Postagem postagem = postagemMapper.toEntity(postagemRequestDTO);
		postagem.setUsuario(usuario);
		
		Postagem salvo = postagemRepository.save(postagem);
		return postagemMapper.toDTO(salvo);
	}
	
	@Transactional
	public PostagemResponseDTO atualizarPostagem(Long idPostagem, PostagemRequestDTO postagemRequestDTO) {
		Postagem postagem = postagemRepository.findById(idPostagem)
				.orElseThrow(() -> new EntityNotFoundException("Sem postagem com o ID informado!"));
		Usuario usuario = usuarioRepository.findById(postagemRequestDTO.usuarioId())
				.orElseThrow(() -> new EntityNotFoundException("Sem usuário com o ID informado!"));
		
		postagemMapper.toUpdate(postagemRequestDTO, postagem);
		postagem.setUsuario(usuario);
		
		Postagem salvo = postagemRepository.save(postagem);
		return postagemMapper.toDTO(salvo);
	}
	
	@Transactional
	public void deletarPostagem(Long idPostagem) {
		Postagem postagem = postagemRepository.findById(idPostagem)
				.orElseThrow(() -> new EntityNotFoundException("Sem postagem com o ID informado!"));
		try {
			List<String> urlsAntigas = obterUrlsImagem(postagem);
			postagemRepository.delete(postagem);
			imagemUploadUtil.limparAposTransacao(urlsAntigas, List.of());
		} catch (DataIntegrityViolationException e) {
            throw new IllegalStateException("Não é possível deletar a postagem, pois ela está associada a outras entidades!");
		}
	}

	@Transactional
	public PostagemResponseDTO substituirImagens(Long idPostagem, Usuario usuarioLogado, List<MultipartFile> arquivos) {
		Postagem postagem = postagemRepository.findById(idPostagem)
				.orElseThrow(() -> new EntityNotFoundException("Sem postagem com o ID informado!"));
		validarAcesso(postagem, usuarioLogado);

		List<String> urlsNovas = imagemUploadUtil.salvarImagens(arquivos);
		List<String> urlsAntigas = obterUrlsImagem(postagem);
		imagemUploadUtil.limparAposTransacao(urlsAntigas, urlsNovas);
		postagem.getImagens().clear();
		postagemRepository.flush();
		adicionarImagens(postagem, urlsNovas);
		return postagemMapper.toDTO(postagemRepository.save(postagem));
	}

	@Transactional
	public void removerImagens(Long idPostagem, Usuario usuarioLogado) {
		Postagem postagem = postagemRepository.findById(idPostagem)
				.orElseThrow(() -> new EntityNotFoundException("Sem postagem com o ID informado!"));
		validarAcesso(postagem, usuarioLogado);

		List<String> urlsAntigas = obterUrlsImagem(postagem);
		imagemUploadUtil.limparAposTransacao(urlsAntigas, List.of());
		postagem.getImagens().clear();
		postagem.setUrlImagemPostagem(null);
		postagemRepository.save(postagem);
	}

	private void validarAcesso(Postagem postagem, Usuario usuarioLogado) {
		boolean administrador = usuarioLogado.getAuthorities().stream()
				.map(GrantedAuthority::getAuthority)
				.anyMatch("ROLE_ADMIN"::equals);
		if (!administrador && !postagem.getUsuario().getIdUsuario().equals(usuarioLogado.getIdUsuario())) {
			throw new SecurityException("Você não tem permissão para alterar as imagens desta postagem.");
		}
	}

	private List<String> obterUrlsImagem(Postagem postagem) {
		List<String> urls = postagem.getImagens().stream()
				.map(PostagemImagem::getUrlImagem)
				.collect(java.util.stream.Collectors.toCollection(java.util.ArrayList::new));
		if (postagem.getUrlImagemPostagem() != null && !urls.contains(postagem.getUrlImagemPostagem())) {
			urls.add(postagem.getUrlImagemPostagem());
		}
		return urls;
	}

	private void adicionarImagens(Postagem postagem, List<String> urls) {
		for (int i = 0; i < urls.size(); i++) {
			PostagemImagem imagem = new PostagemImagem();
			imagem.setPostagem(postagem);
			imagem.setUrlImagem(urls.get(i));
			imagem.setOrdem(i);
			postagem.getImagens().add(imagem);
		}
		postagem.setUrlImagemPostagem(urls.getFirst());
	}
}
