package com.pitcherx.controller;

import java.util.List;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pitcherx.dto.proposta.PropostaRequestDTO;
import com.pitcherx.dto.proposta.PropostaResponseDTO;
import com.pitcherx.service.PropostaService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/proposta")
@Tag(name = "Proposta", description = "Endpoints para gerenciamento de propostas")
public class PropostaController {

	private final PropostaService propostaService;
	
	public PropostaController(PropostaService propostaService) {
		this.propostaService = propostaService;
	}
	
	@GetMapping
	@Operation(summary = "Listar Propostas", description = "Retorna uma lista de todas as propostas cadastradas")
	public ResponseEntity<List<PropostaResponseDTO>> getPropostas(){
		return ResponseEntity.status(HttpStatus.OK).body(propostaService.listarPropostas());
	}
	
	@GetMapping("/{id}")
	@Operation(summary = "Buscar Proposta por ID", description = "Retorna uma proposta específica com base no ID fornecido")
	public ResponseEntity<PropostaResponseDTO> getPropostaById(@PathVariable Long id){
		return ResponseEntity.status(HttpStatus.OK).body(propostaService.buscarPropostaPorId(id));
	}
	
	@PostMapping
	@Operation(summary = "Criar Proposta", description = "Cria uma nova proposta com base nos dados fornecidos")
	public ResponseEntity<PropostaResponseDTO> saveProposta(@Valid @RequestBody PropostaRequestDTO propostaRequestDTO){
		PropostaResponseDTO propostaResponseDTO = propostaService.criarProposta(propostaRequestDTO);
		return ResponseEntity.status(HttpStatus.CREATED).body(propostaResponseDTO);
	}
	
	@PutMapping("/{id}")
	@Operation(summary = "Atualizar Proposta", description = "Atualiza uma proposta existente com base no ID fornecido e nos dados fornecidos")
	public ResponseEntity<PropostaResponseDTO> updateProposta(@PathVariable Long id, @Valid @RequestBody PropostaRequestDTO propostaRequestDTO){
		PropostaResponseDTO propostaResponseDTO = propostaService.atualizarProposta(id, propostaRequestDTO);
		return ResponseEntity.status(HttpStatus.OK).body(propostaResponseDTO);
	}
	
	@DeleteMapping("/{id}")
	@Operation(summary = "Deletar Proposta", description = "Deleta uma proposta existente com base no ID fornecido")
	public ResponseEntity<Void> deleteProposta(@PathVariable Long id){
		propostaService.deletarProposta(id);
		return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
	}
	
}
