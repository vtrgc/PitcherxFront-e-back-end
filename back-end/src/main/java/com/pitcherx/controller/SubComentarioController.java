package com.pitcherx.controller;

import java.util.List;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pitcherx.dto.subComentario.SubComentarioRequestDTO;
import com.pitcherx.dto.subComentario.SubComentarioResponseDTO;
import com.pitcherx.service.SubComentarioService;

@RestController
@RequestMapping("/sub-comentario")
@Tag(name = "SubComentario", description = "Endpoints para gerenciamento de sub-comentários.")
public class SubComentarioController {

	private final SubComentarioService subComentarioService;
	
	public SubComentarioController(SubComentarioService subComentarioService) {
		this.subComentarioService = subComentarioService;
	}
	
	@GetMapping
	@Operation(summary = "Listar sub-comentários", description = "Retorna uma lista de todos os sub-comentários cadastrados.")
	@PreAuthorize("permitAll()")
	public ResponseEntity<List<SubComentarioResponseDTO>> getSubComentarios(){
		return ResponseEntity.status(HttpStatus.OK).body(subComentarioService.listarSubComentarios());
	}
	
	@GetMapping("/{id}")
	@Operation(summary = "Buscar sub-comentário por ID", description = "Retorna um sub-comentário específico com base no ID fornecido.")
	@PreAuthorize("permitAll()")
	public ResponseEntity<SubComentarioResponseDTO> getSubComentarioById(@PathVariable Long id){
		return ResponseEntity.status(HttpStatus.OK).body(subComentarioService.buscarSubComentarioPorId(id));
	}
	
	@PostMapping
	@Operation(summary = "Criar sub-comentário", description = "Cria um novo sub-comentário com base nos dados fornecidos.")
	@PreAuthorize("hasAnyRole('USUARIO', 'EMPRESA')")
	public ResponseEntity<SubComentarioResponseDTO> saveSubComentario(@Valid @RequestBody SubComentarioRequestDTO subComentarioRequestDTO){
		SubComentarioResponseDTO subComentarioResponseDTO = subComentarioService.criarSubComentario(subComentarioRequestDTO);
		return ResponseEntity.status(HttpStatus.CREATED).body(subComentarioResponseDTO);
	}
	
	@PutMapping("/{id}")
	@Operation(summary = "Atualizar sub-comentário", description = "Atualiza um sub-comentário existente com base nos dados fornecidos.")
	@PreAuthorize("hasAnyRole('USUARIO', 'EMPRESA')")
	public ResponseEntity<SubComentarioResponseDTO> updateSubComentario(@PathVariable Long id, @Valid @RequestBody SubComentarioRequestDTO subComentarioRequestDTO){
		SubComentarioResponseDTO subComentarioResponseDTO = subComentarioService.atualizarSubComentario(id, subComentarioRequestDTO);
		return ResponseEntity.status(HttpStatus.OK).body(subComentarioResponseDTO);
	}
	
	@DeleteMapping("/{id}")
	@Operation(summary = "Deletar sub-comentário", description = "Deleta um sub-comentário existente com base no ID fornecido.")
	@PreAuthorize("hasAnyRole('USUARIO', 'EMPRESA', 'ADMIN')")
	public ResponseEntity<Void> deleteSubComentario(@PathVariable Long id){
		subComentarioService.deletarSubComentario(id);
		return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
	}
	
	
}
