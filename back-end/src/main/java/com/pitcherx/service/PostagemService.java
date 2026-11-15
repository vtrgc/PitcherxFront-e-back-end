package com.pitcherx.service;

import com.pitcherx.security.Permissoes;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pitcherx.dto.postagem.PostagemRequestDTO;
import com.pitcherx.dto.postagem.PostagemResponseDTO;
import com.pitcherx.mapper.PostagemMapper;
import com.pitcherx.model.Postagem;
import com.pitcherx.model.PostagemImagem;
import com.pitcherx.model.PostagemVideo;
import com.pitcherx.model.Usuario;
import com.pitcherx.repository.PostagemRepository;
import com.pitcherx.repository.UsuarioRepository;
import com.pitcherx.utils.UploadUtil;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.multipart.MultipartFile;

@Service
public class PostagemService {

	private final PostagemRepository postagemRepository;
	private final PostagemMapper postagemMapper;
	private final UsuarioRepository usuarioRepository;
	private final UploadUtil uploadUtil;

	@Autowired
	private Permissoes permissoes;
	
	public PostagemService(PostagemRepository postagemRepository, PostagemMapper postagemMapper,
			UsuarioRepository usuarioRepository, UploadUtil uploadUtil) {
		this.postagemRepository = postagemRepository;
		this.postagemMapper = postagemMapper;
		this.usuarioRepository = usuarioRepository;
		this.uploadUtil = uploadUtil;
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
		permissoes.exigirProprio(postagemRequestDTO.usuarioId(), "Você só pode publicar em seu próprio nome.");
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
		// Só o autor edita, e a autoria não muda (o usuarioId do corpo é ignorado).
		permissoes.exigirProprio(postagem.getUsuario().getIdUsuario(), "Apenas o autor pode editar esta publicação.");
		
		postagemMapper.toUpdate(postagemRequestDTO, postagem);
		
		Postagem salvo = postagemRepository.save(postagem);
		return postagemMapper.toDTO(salvo);
	}
	
	@Transactional
	public void deletarPostagem(Long idPostagem) {
		Postagem postagem = postagemRepository.findById(idPostagem)
				.orElseThrow(() -> new EntityNotFoundException("Sem postagem com o ID informado!"));
		permissoes.exigirProprioOuAdmin(postagem.getUsuario().getIdUsuario(), "Apenas o autor ou um administrador pode excluir esta publicação.");
		try {
			List<String> urlsAntigasImagens = obterUrlsImagem(postagem);
			List<String> urlsAntigasVideos = obterUrlsVideo(postagem);
			postagemRepository.delete(postagem);
			uploadUtil.limparAposTransacaoImagens(urlsAntigasImagens, List.of());
			uploadUtil.limparAposTransacaoVideos(urlsAntigasVideos, List.of());
		} catch (DataIntegrityViolationException e) {
            throw new IllegalStateException("Não é possível deletar a postagem, pois ela está associada a outras entidades!");
		}
	}

	@Transactional
	public PostagemResponseDTO substituirImagens(Long idPostagem, Usuario usuarioLogado, List<MultipartFile> arquivos) {
		Postagem postagem = postagemRepository.findById(idPostagem)
				.orElseThrow(() -> new EntityNotFoundException("Sem postagem com o ID informado!"));
		validarAcesso(postagem, usuarioLogado);

		List<String> urlsNovas = uploadUtil.salvarImagens(arquivos);
		List<String> urlsAntigas = obterUrlsImagem(postagem);
		uploadUtil.limparAposTransacaoImagens(urlsAntigas, urlsNovas);
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
		uploadUtil.limparAposTransacaoImagens(urlsAntigas, List.of());
		postagem.getImagens().clear();
		postagem.setUrlImagemPostagem(null);
		postagemRepository.save(postagem);
	}

	@Transactional
	public PostagemResponseDTO substituirVideos(Long idPostagem, Usuario usuarioLogado, List<MultipartFile> arquivos) {
		Postagem postagem = postagemRepository.findById(idPostagem)
				.orElseThrow(() -> new EntityNotFoundException("Sem postagem com o ID informado!"));
		validarAcesso(postagem, usuarioLogado);

		List<String> urlsNovas = uploadUtil.salvarVideos(arquivos);
		List<String> urlsAntigas = obterUrlsVideo(postagem);
		uploadUtil.limparAposTransacaoVideos(urlsAntigas, urlsNovas);
		postagem.getVideos().clear();
		postagemRepository.flush();
		adicionarVideos(postagem, urlsNovas);
		return postagemMapper.toDTO(postagemRepository.save(postagem));
	}

	@Transactional
	public void removerVideos(Long idPostagem, Usuario usuarioLogado) {
		Postagem postagem = postagemRepository.findById(idPostagem)
				.orElseThrow(() -> new EntityNotFoundException("Sem postagem com o ID informado!"));
		validarAcesso(postagem, usuarioLogado);

		List<String> urlsAntigas = obterUrlsVideo(postagem);
		uploadUtil.limparAposTransacaoVideos(urlsAntigas, List.of());
		postagem.getVideos().clear();
		postagem.setUrlVideoPostagem(null);
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
		postagem.setUrlImagemPostagem(urls.get(0));
	}

	private List<String> obterUrlsVideo(Postagem postagem) {
		List<String> urls = postagem.getVideos().stream()
				.map(PostagemVideo::getUrlVideo)
				.collect(java.util.stream.Collectors.toCollection(java.util.ArrayList::new));
		if (postagem.getUrlVideoPostagem() != null && !urls.contains(postagem.getUrlVideoPostagem())) {
			urls.add(postagem.getUrlVideoPostagem());
		}
		return urls;
	}

	private void adicionarVideos(Postagem postagem, List<String> urls) {
		for (int i = 0; i < urls.size(); i++) {
			PostagemVideo video = new PostagemVideo();
			video.setPostagem(postagem);
			video.setUrlVideo(urls.get(i));
			video.setOrdem(i);
			postagem.getVideos().add(video);
		}
		postagem.setUrlVideoPostagem(urls.get(0));
	}
}
