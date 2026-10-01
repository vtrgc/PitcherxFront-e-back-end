package com.pitcherx.controller;

import java.time.LocalDate;
import java.util.List;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.pitcherx.dto.projeto.ProjetoRequestDTO;
import com.pitcherx.dto.projeto.ProjetoResponseDTO;
import com.pitcherx.model.Usuario;
import com.pitcherx.service.ProjetoService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/projeto")
@Tag(name = "Projeto", description = "Endpoints para gerenciamento de projetos")
public class ProjetoController {

	private final ProjetoService projetoService;
	
	public ProjetoController(ProjetoService projetoService) {
		this.projetoService = projetoService;
	}
	
	@GetMapping
	@PreAuthorize("permitAll()")
    @Operation(description = "Endpoint para listar os projetos publicados")
	public ResponseEntity<List<ProjetoResponseDTO>> getProjetos(){
		return ResponseEntity.status(HttpStatus.OK).body(projetoService.listarProjetos());
	}
	
	@GetMapping("/{id}")
	@PreAuthorize("permitAll()")
    @Operation(description = "Endpoint para obter um projeto específico por ID")
	public ResponseEntity<ProjetoResponseDTO> getProjetoById(@PathVariable Long id){
		return ResponseEntity.status(HttpStatus.OK).body(projetoService.buscarProjetoPorId(id));
	}

	@GetMapping("/buscar")
	@PreAuthorize("permitAll()")
	@Operation(description = "Endpoint para buscar projetos com filtros opcionais")
	public ResponseEntity<List<ProjetoResponseDTO>> buscarProjetos(
			@RequestParam(required = false) String nome,
			@RequestParam(required = false) String descricao,
			@RequestParam(required = false) LocalDate dataInicioDe,
			@RequestParam(required = false) LocalDate dataInicioAte) {
		return ResponseEntity.status(HttpStatus.OK)
				.body(projetoService.buscarProjetos(nome, descricao, dataInicioDe, dataInicioAte));
	}
	
	@PostMapping
	@PreAuthorize("hasAnyRole('USUARIO', 'EMPRESA')")
    @Operation(description = "Endpoint para criar um novo projeto")
	public ResponseEntity<ProjetoResponseDTO> createProjeto(@Valid @RequestBody ProjetoRequestDTO projetoRequestDTO){
		ProjetoResponseDTO projetoResponseDTO = projetoService.criarProjeto(projetoRequestDTO);
		return ResponseEntity.status(HttpStatus.CREATED).body(projetoResponseDTO);
	}
	
	@PutMapping("/{id}")
	@PreAuthorize("hasAnyRole('USUARIO', 'EMPRESA')")
    @Operation(description = "Endpoint para atualizar um projeto")
	public ResponseEntity<ProjetoResponseDTO> updateProjeto(@PathVariable Long id, @Valid @RequestBody ProjetoRequestDTO projetoRequestDTO){
		ProjetoResponseDTO projetoResponseDTO = projetoService.atualizarProjeto(id, projetoRequestDTO);
		return ResponseEntity.status(HttpStatus.OK).body(projetoResponseDTO);
	}

	@PutMapping(value = "/{id}/imagens", consumes = "multipart/form-data")
	@PreAuthorize("hasAnyRole('USUARIO', 'EMPRESA', 'ADMIN')")
	@Operation(summary = "Substituir imagens do projeto", description = "Envia de 1 a 10 imagens em ordem para substituir a galeria.")
	public ResponseEntity<ProjetoResponseDTO> substituirImagens(
			@PathVariable Long id,
			@RequestParam("arquivos") List<MultipartFile> arquivos,
			@AuthenticationPrincipal Usuario usuario) {
		return ResponseEntity.ok(projetoService.substituirImagens(id, usuario, arquivos));
	}

	@DeleteMapping("/{id}/imagens")
	@PreAuthorize("hasAnyRole('USUARIO', 'EMPRESA', 'ADMIN')")
	@Operation(summary = "Remover imagens do projeto", description = "Remove todas as imagens da galeria.")
	public ResponseEntity<Void> removerImagens(@PathVariable Long id, @AuthenticationPrincipal Usuario usuario) {
		projetoService.removerImagens(id, usuario);
		return ResponseEntity.noContent().build();
	}
	
	@DeleteMapping("/{id}")
	@PreAuthorize("hasAnyRole('ADMIN', 'USUARIO', 'EMPRESA')")
	@Operation(description = "Endpoint para deletar um projeto")
	public ResponseEntity<Void> deleteProjeto(@PathVariable Long id){
		projetoService.deletarProjeto(id);
		return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
	}
	
}
