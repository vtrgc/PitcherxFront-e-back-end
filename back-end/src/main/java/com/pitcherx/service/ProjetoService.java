package com.pitcherx.service;

import java.time.LocalDate;
import java.util.List;

import com.pitcherx.model.ProjetoImagem;
import com.pitcherx.model.ProjetoUsuario;
import com.pitcherx.model.Usuario;
import com.pitcherx.specs.ProjetoSpecification;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.pitcherx.dto.projeto.ProjetoRequestDTO;
import com.pitcherx.dto.projeto.ProjetoResponseDTO;
import com.pitcherx.mapper.ProjetoMapper;
import com.pitcherx.model.Projeto;
import com.pitcherx.model.TipoProjeto;
import com.pitcherx.repository.ProjetoRepository;
import com.pitcherx.repository.TipoProjetoRepository;
import com.pitcherx.utils.ImagemUploadUtil;

import jakarta.persistence.EntityNotFoundException;

@Service
public class ProjetoService {
	
	private final ProjetoRepository projetoRepository;
	private final ProjetoMapper projetoMapper;
	private final TipoProjetoRepository tipoProjetoRepository;
	private final ImagemUploadUtil imagemUploadUtil;
	
	public ProjetoService(ProjetoRepository projetoRepository, ProjetoMapper projetoMapper,
			TipoProjetoRepository tipoProjetoRepository, ImagemUploadUtil imagemUploadUtil) {
		this.projetoRepository = projetoRepository;
		this.projetoMapper = projetoMapper;
		this.tipoProjetoRepository = tipoProjetoRepository;
		this.imagemUploadUtil = imagemUploadUtil;
	}
	
	@Transactional(readOnly = true)
	public List<ProjetoResponseDTO> listarProjetos(){
		return projetoRepository.findAll().stream()
				.map(projetoMapper::toDTO)
				.toList();
	}
	
	@Transactional(readOnly = true)
	public ProjetoResponseDTO buscarProjetoPorId(Long idProjeto) {
		Projeto projeto = projetoRepository.findById(idProjeto)
				.orElseThrow(() -> new EntityNotFoundException("Sem projeto com o ID informado!"));
		return projetoMapper.toDTO(projeto);
	}

	@Transactional(readOnly = true)
	public List<ProjetoResponseDTO> buscarProjetos(String nome, String descricao, LocalDate dataInicioDe, LocalDate dataInicioAte) {
		Specification<Projeto> spec = Specification
				.where(ProjetoSpecification.comNome(nome))
				.and(ProjetoSpecification.comDescricao(descricao))
				.and(ProjetoSpecification.comDataInicioApartirDe(dataInicioDe))
				.and(ProjetoSpecification.comDataInicioEntre(dataInicioDe, dataInicioAte));

		return projetoRepository.findAll(spec).stream()
				.map(projetoMapper::toDTO)
				.toList();
	}
	
	@Transactional
	public ProjetoResponseDTO criarProjeto(ProjetoRequestDTO projetoRequestDTO) {
		TipoProjeto tipoProjeto = tipoProjetoRepository.findById(projetoRequestDTO.tipoProjetoId())
				.orElseThrow(() -> new EntityNotFoundException("Sem tipo de projeto com o ID informado!"));
		
		Projeto projeto = projetoMapper.toEntity(projetoRequestDTO);
		projeto.setTipoProjeto(tipoProjeto);
		
		Projeto salvo = projetoRepository.save(projeto);
		return projetoMapper.toDTO(salvo);
	}
	
	@Transactional
	public ProjetoResponseDTO atualizarProjeto(Long idProjeto, ProjetoRequestDTO projetoRequestDTO) {
		Projeto projeto = projetoRepository.findById(idProjeto)
				.orElseThrow(() -> new EntityNotFoundException("Sem projeto com o ID informado!"));
		
		TipoProjeto tipoProjeto = tipoProjetoRepository.findById(projetoRequestDTO.tipoProjetoId())
				.orElseThrow(() -> new EntityNotFoundException("Sem tipo de projeto com o ID informado!"));
		
		projetoMapper.toUpdate(projetoRequestDTO, projeto);
		projeto.setTipoProjeto(tipoProjeto);
		
		Projeto salvo = projetoRepository.save(projeto);
		return projetoMapper.toDTO(salvo);
	}
	
	@Transactional
	public void deletarProjeto(Long idProjeto) {
		Projeto projeto = projetoRepository.findById(idProjeto)
				.orElseThrow(() -> new EntityNotFoundException("Sem projeto com o ID informado!"));
		try {
			List<String> urlsAntigas = obterUrlsImagem(projeto);
			projetoRepository.delete(projeto);
			imagemUploadUtil.limparAposTransacao(urlsAntigas, List.of());
		} catch (DataIntegrityViolationException e) {
            throw new IllegalArgumentException("Não é possível deletar este projeto, pois ele está associado a outras entidades.");
		}
	}

	@Transactional
	public ProjetoResponseDTO substituirImagens(Long idProjeto, Usuario usuarioLogado, List<MultipartFile> arquivos) {
		Projeto projeto = projetoRepository.findById(idProjeto)
				.orElseThrow(() -> new EntityNotFoundException("Sem projeto com o ID informado!"));
		validarAcessoImagens(projeto, usuarioLogado);

		List<String> urlsNovas = imagemUploadUtil.salvarImagens(arquivos);
		List<String> urlsAntigas = obterUrlsImagem(projeto);
		imagemUploadUtil.limparAposTransacao(urlsAntigas, urlsNovas);
		projeto.getImagens().clear();
		projetoRepository.flush();
		atualizarImagens(projeto, urlsNovas);
		return projetoMapper.toDTO(projetoRepository.save(projeto));
	}

	@Transactional
	public void removerImagens(Long idProjeto, Usuario usuarioLogado) {
		Projeto projeto = projetoRepository.findById(idProjeto)
				.orElseThrow(() -> new EntityNotFoundException("Sem projeto com o ID informado!"));
		validarAcessoImagens(projeto, usuarioLogado);

		List<String> urlsAntigas = obterUrlsImagem(projeto);
		imagemUploadUtil.limparAposTransacao(urlsAntigas, List.of());
		projeto.getImagens().clear();
		projeto.setUrlImagemProjeto(null);
		projetoRepository.save(projeto);
	}

	private void validarAcessoImagens(Projeto projeto, Usuario usuarioLogado) {
		boolean administrador = usuarioLogado.getAuthorities().stream()
				.map(GrantedAuthority::getAuthority)
				.anyMatch("ROLE_ADMIN"::equals);
		boolean vinculadoAoProjeto = projeto.getUsuarios().stream()
				.map(ProjetoUsuario::getUsuario)
				.anyMatch(usuario -> usuario.getIdUsuario().equals(usuarioLogado.getIdUsuario()));
		if (!administrador && !vinculadoAoProjeto) {
			throw new SecurityException("Você não tem permissão para alterar as imagens deste projeto.");
		}
	}

	private List<String> obterUrlsImagem(Projeto projeto) {
		List<String> urls = projeto.getImagens().stream()
				.map(ProjetoImagem::getUrlImagem)
				.collect(java.util.stream.Collectors.toCollection(java.util.ArrayList::new));
		if (projeto.getUrlImagemProjeto() != null && !urls.contains(projeto.getUrlImagemProjeto())) {
			urls.add(projeto.getUrlImagemProjeto());
		}
		return urls;
	}

	private void atualizarImagens(Projeto projeto, List<String> urls) {
		for (int i = 0; i < urls.size(); i++) {
			ProjetoImagem imagem = new ProjetoImagem();
			imagem.setProjeto(projeto);
			imagem.setUrlImagem(urls.get(i));
			imagem.setOrdem(i);
			projeto.getImagens().add(imagem);
		}
		projeto.setUrlImagemProjeto(urls.getFirst());
	}

}
