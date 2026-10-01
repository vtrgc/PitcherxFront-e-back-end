package com.pitcherx.controller;

import java.util.List;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.pitcherx.dto.postagem.PostagemRequestDTO;
import com.pitcherx.dto.postagem.PostagemResponseDTO;
import com.pitcherx.model.Usuario;
import com.pitcherx.service.PostagemService;

import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/postagem")
@Tag(name = "Postagem", description = "Endpoints para gerenciamento de postagens.")
public class PostagemController {

	private final PostagemService postagemService;
	
	public PostagemController(PostagemService postagemService) {
		this.postagemService = postagemService;
	}
	
	@GetMapping
	@Operation(summary = "Listar postagens", description = "Retorna uma lista de todas as postagens.")
	@PreAuthorize("permitAll()")
	public ResponseEntity<List<PostagemResponseDTO>> getPostagens(){
		return ResponseEntity.status(HttpStatus.OK).body(postagemService.listarPostagens());
	}
	
	@GetMapping("/{id}")
	@Operation(summary = "Buscar postagem por ID", description = "Retorna uma postagem específica com base no ID fornecido.")
	@PreAuthorize("permitAll()")
	public ResponseEntity<PostagemResponseDTO> getPostagemById(@PathVariable Long id){
		return ResponseEntity.status(HttpStatus.OK).body(postagemService.buscarPostagemPorId(id));
	}
	
	@PostMapping
	@Operation(summary = "Criar postagem", description = "Cria uma nova postagem.")
	@PreAuthorize("hasAnyRole('USUARIO', 'EMPRESA')")
	public ResponseEntity<PostagemResponseDTO> savePostagem(@Valid @RequestBody PostagemRequestDTO postagemRequestDTO){
		PostagemResponseDTO postagemResponseDTO = postagemService.criarPostagem(postagemRequestDTO);
		return ResponseEntity.status(HttpStatus.CREATED).body(postagemResponseDTO);
	}
	
	@PutMapping("/{id}")
	@Operation(summary = "Atualizar postagem", description = "Atualiza uma postagem existente com base no ID fornecido e nos dados fornecidos.")
	@PreAuthorize("hasAnyRole('USUARIO', 'EMPRESA')")
	public ResponseEntity<PostagemResponseDTO> updatePostagem(@PathVariable Long id, @Valid @RequestBody PostagemRequestDTO postagemRequestDTO){
		PostagemResponseDTO postagemResponseDTO = postagemService.atualizarPostagem(id, postagemRequestDTO);
		return ResponseEntity.status(HttpStatus.OK).body(postagemResponseDTO);
	}

	@PutMapping(value = "/{id}/imagens", consumes = "multipart/form-data")
	@Operation(summary = "Substituir imagens da postagem", description = "Envia de 1 a 10 imagens em ordem para substituir a galeria.")
	@PreAuthorize("hasAnyRole('USUARIO', 'EMPRESA', 'ADMIN')")
	public ResponseEntity<PostagemResponseDTO> substituirImagens(
			@PathVariable Long id,
			@RequestParam("arquivos") List<MultipartFile> arquivos,
			@AuthenticationPrincipal Usuario usuario) {
		return ResponseEntity.ok(postagemService.substituirImagens(id, usuario, arquivos));
	}

	@DeleteMapping("/{id}/imagens")
	@Operation(summary = "Remover imagens da postagem", description = "Remove todas as imagens da galeria.")
	@PreAuthorize("hasAnyRole('USUARIO', 'EMPRESA', 'ADMIN')")
	public ResponseEntity<Void> removerImagens(@PathVariable Long id, @AuthenticationPrincipal Usuario usuario) {
		postagemService.removerImagens(id, usuario);
		return ResponseEntity.noContent().build();
	}
	
	@DeleteMapping("/{id}")
	@Operation(summary = "Deletar postagem", description = "Deleta uma postagem existente com base no ID fornecido.")
	@PreAuthorize("hasAnyRole('USUARIO', 'EMPRESA', 'ADMIN')")
	public ResponseEntity<Void> deletePostagemById(@PathVariable Long id){
		postagemService.deletarPostagem(id);
		return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
	}
}
