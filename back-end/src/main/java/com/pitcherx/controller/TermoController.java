package com.pitcherx.controller;

import com.pitcherx.dto.termo.TermoRequestDTO;
import com.pitcherx.dto.termo.TermoResponseDTO;
import com.pitcherx.service.TermoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/termo")
@Tag(name = "Termo", description = "API para gerenciamento de termos")
public class TermoController {

    private final TermoService termoService;

    public TermoController(TermoService termoService) {
        this.termoService = termoService;
    }

    @GetMapping
    @PreAuthorize("permitAll()")
    @Operation(summary = "Listar todos os termos", description = "Retorna uma lista de todos os termos cadastrados")
    public ResponseEntity<List<TermoResponseDTO>> getTermos(){
        return ResponseEntity.status(HttpStatus.OK).body(termoService.listarTermos());
    }

    @GetMapping("/{id}")
    @PreAuthorize("permitAll()")
    @Operation(summary = "Buscar termo por ID", description = "Retorna um termo específico com base no ID fornecido")
    public ResponseEntity<TermoResponseDTO> getTermoById(@PathVariable Long id){
        return ResponseEntity.status(HttpStatus.OK).body(termoService.buscarTermoPorId(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Criar novo termo", description = "Cria um novo termo com base nos dados fornecidos")
    public ResponseEntity<TermoResponseDTO> createTermo(@Valid @RequestBody TermoRequestDTO termoRequestDTO){
        TermoResponseDTO termoResponseDTO = termoService.criarTermo(termoRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(termoResponseDTO);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Atualizar termo existente", description = "Atualiza um termo existente com base no ID fornecido e nos dados fornecidos")
    public ResponseEntity<TermoResponseDTO> updateTermo(@PathVariable Long id, @Valid @RequestBody TermoRequestDTO termoRequestDTO){
        TermoResponseDTO termoResponseDTO = termoService.atualizarTermo(id, termoRequestDTO);
        return ResponseEntity.status(HttpStatus.OK).body(termoResponseDTO);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Deletar termo", description = "Deleta um termo específico com base no ID fornecido")
    public ResponseEntity<Void> deleteTermo(@PathVariable Long id) {
        termoService.deletarTermo(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

}
