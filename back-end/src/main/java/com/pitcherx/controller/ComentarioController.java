package com.pitcherx.controller;

import java.util.List;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pitcherx.dto.comentario.ComentarioRequestDTO;
import com.pitcherx.dto.comentario.ComentarioResponseDTO;
import com.pitcherx.service.ComentarioService;

import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/comentario")
@Tag(name = "Comentario", description = "Endpoints para gerenciamento de comentarios.")
public class ComentarioController {

	private final ComentarioService comentarioService;
	
	public ComentarioController(ComentarioService comentarioService) {
		this.comentarioService = comentarioService;
	}
	
	@GetMapping
	@Operation(summary = "Listar Comentarios", description = "Retorna uma lista de todos os comentarios.")
	@PreAuthorize("permitAll()")
	public ResponseEntity<List<ComentarioResponseDTO>> getComentarios(){
		return ResponseEntity.status(HttpStatus.OK).body(comentarioService.listarComentarios());
	}
	
	@GetMapping("/{id}")
	@Operation(summary = "Buscar Comentario por ID", description = "Retorna um comentario específico pelo seu ID.")
	@PreAuthorize("permitAll()")
	public ResponseEntity<ComentarioResponseDTO> getComentarioById(@PathVariable Long id){
		return ResponseEntity.status(HttpStatus.OK).body(comentarioService.buscarComentarioPorId(id));
	}
	
	@PostMapping
	@Operation(summary = "Criar Comentario", description = "Cria um novo comentario.")
	@PreAuthorize("hasAnyRole('USUARIO', 'EMPRESA')")
	public ResponseEntity<ComentarioResponseDTO> saveComentario(@Valid @RequestBody ComentarioRequestDTO comentarioRequestDTO){
		ComentarioResponseDTO comentarioResponseDTO = comentarioService.criarComentario(comentarioRequestDTO);
		return ResponseEntity.status(HttpStatus.CREATED).body(comentarioResponseDTO);
	}
	
	@PutMapping("/{id}")
	@Operation(summary = "Atualizar Comentario", description = "Atualiza um comentario existente com base no ID fornecido e nos dados fornecidos")
	@PreAuthorize("hasAnyRole('USUARIO', 'EMPRESA')")
	public ResponseEntity<ComentarioResponseDTO> updateComentario(@PathVariable Long id, @Valid @RequestBody ComentarioRequestDTO comentarioRequestDTO){
		ComentarioResponseDTO comentarioResponseDTO = comentarioService.atualizarComentario(id, comentarioRequestDTO);
		return ResponseEntity.status(HttpStatus.OK).body(comentarioResponseDTO);
	}
	
	@DeleteMapping("/{id}")
	@Operation(summary = "Deletar Comentario", description = "Deleta um comentario existente com base no ID fornecido")
	@PreAuthorize("hasAnyRole('USUARIO', 'EMPRESA', 'ADMIN')")
	public ResponseEntity<Void> deleteComentario(@PathVariable Long id){
		comentarioService.deletarComentario(id);
		return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
	}
	
	
}
