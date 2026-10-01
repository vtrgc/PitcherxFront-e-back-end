package com.pitcherx.controller;

import java.util.List;


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

import com.pitcherx.dto.endereco.EnderecoRequestDTO;
import com.pitcherx.dto.endereco.EnderecoResponseDTO;
import com.pitcherx.service.EnderecoService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/endereco")
@Tag(name = "Endereco", description = "Endpoints para gerenciamento de endereços.")
public class EnderecoController {

	private final EnderecoService enderecoService;
	
	public EnderecoController(EnderecoService enderecoService) {
		this.enderecoService = enderecoService;
	}
	
	@GetMapping
    @Operation(summary = "Listagem de endereços", description = "Este endpoint faz a listagem de todos os endereços.")
	@PreAuthorize("permitAll()")
	public ResponseEntity<List<EnderecoResponseDTO>> getEnderecos(){
		return ResponseEntity.status(HttpStatus.OK).body(enderecoService.listarEndereco());
	}
	
	@GetMapping("/{id}")
    @Operation(summary = "Busca de endereço por ID", description = "Este endpoint faz a busca de endereço através do ID.")
	@PreAuthorize("permitAll()")
	public ResponseEntity<EnderecoResponseDTO> getEnderecoById(@PathVariable Long id){
		return ResponseEntity.status(HttpStatus.OK).body(enderecoService.buscarEnderecoPorId(id));
	}
	
	@PostMapping
    @Operation(summary = "Cadastro de endereço", description = "Este endpoint faz o cadastro de endereço.")
	@PreAuthorize("hasAnyRole('ADMIN','USUARIO', 'EMPRESA')")
	public ResponseEntity<EnderecoResponseDTO> createEndereco(@Valid @RequestBody EnderecoRequestDTO enderecoRequestDTO){
		EnderecoResponseDTO enderecoResponseDTO = enderecoService.criarEndereco(enderecoRequestDTO);
		return ResponseEntity.status(HttpStatus.CREATED).body(enderecoResponseDTO);
	}
	
	@PutMapping("/{id}")
    @Operation(summary = "Atualização de endereço", description = "Este endpoint faz a atualização de endereço através do ID.")
	@PreAuthorize("hasAnyRole('ADMIN','USUARIO', 'EMPRESA')")
	public ResponseEntity<EnderecoResponseDTO> updateEndereco(@PathVariable Long id, @Valid @RequestBody EnderecoRequestDTO enderecoRequestDTO){
		EnderecoResponseDTO enderecoResponseDTO = enderecoService.atualizarEndereco(id, enderecoRequestDTO);
		return ResponseEntity.status(HttpStatus.OK).body(enderecoResponseDTO);
	}
	
	@DeleteMapping("/{id}")
    @Operation(summary = "Remover um endereço", description = "Este endpoint faz a remoção de endereço através do ID.")
	@PreAuthorize("hasAnyRole('ADMIN','USUARIO', 'EMPRESA')")
	public ResponseEntity<Void> deleteEndereco(@PathVariable Long id){
		enderecoService.deletarEndereco(id);
		return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
	}
	
}
