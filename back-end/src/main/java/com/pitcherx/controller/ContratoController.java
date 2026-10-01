package com.pitcherx.controller;

import com.pitcherx.dto.contrato.ContratoRequestDTO;
import com.pitcherx.dto.contrato.ContratoResponseDTO;
import com.pitcherx.service.ContratoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/contrato")
@Tag(name = "Contrato", description = "API para gerenciamento de contratos")
public class ContratoController {

    private final ContratoService contratoService;

    public ContratoController(ContratoService contratoService) {
        this.contratoService = contratoService;
    }

    @GetMapping
    @PreAuthorize("permitAll()")
    @Operation(summary = "Listar contratos", description = "Retorna uma lista de todos os contratos cadastrados.")
    public ResponseEntity<List<ContratoResponseDTO>> getContratos(){
        return ResponseEntity.status(HttpStatus.OK).body(contratoService.listarContratos());
    }

    @GetMapping("/{id}")
    @PreAuthorize("permitAll()")
    @Operation(summary = "Buscar contrato por ID", description = "Retorna os detalhes de um contrato específico com base no ID fornecido.")
    public ResponseEntity<ContratoResponseDTO> getContratoById(@PathVariable Long id){
        return ResponseEntity.status(HttpStatus.OK).body(contratoService.buscarContratoPorId(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','USUARIO','EMPRESARIO')")
    @Operation(summary = "Criar contrato", description = "Cria um novo contrato com os dados fornecidos.")
    public ResponseEntity<ContratoResponseDTO> createContrato(@Valid @RequestBody ContratoRequestDTO contratoRequestDTO){
        ContratoResponseDTO contratoResponseDTO = contratoService.criarContrato(contratoRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(contratoResponseDTO);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','USUARIO','EMPRESARIO')")
    @Operation(summary = "Atualizar contrato", description = "Atualiza os dados de um contrato específico com base no ID fornecido.")
    public ResponseEntity<ContratoResponseDTO> updateContrato(@PathVariable Long id, @Valid @RequestBody ContratoRequestDTO contratoRequestDTO){
        ContratoResponseDTO contratoResponseDTO = contratoService.atualizarContrato(id, contratoRequestDTO);
        return ResponseEntity.status(HttpStatus.OK).body(contratoResponseDTO);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','USUARIO','EMPRESARIO')")
    @Operation(summary = "Deletar contrato", description = "Deleta um contrato específico com base no ID fornecido.")
    public ResponseEntity<Void> deleteContrato(@PathVariable Long id) {
        contratoService.deletarContrato(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

}
