package com.pitcherx.controller;

import com.pitcherx.dto.riscoProjeto.RiscoProjetoRequestDTO;
import com.pitcherx.dto.riscoProjeto.RiscoProjetoResponseDTO;
import com.pitcherx.service.RiscoProjetoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/risco-projeto")
@Tag(name = "Risco de projeto", description = "Endpoints para gerenciamento dos riscos de projeto")
public class RiscoProjetoController {

    private final RiscoProjetoService riscoProjetoService;

    public RiscoProjetoController(RiscoProjetoService riscoProjetoService) {
        this.riscoProjetoService = riscoProjetoService;
    }

    @GetMapping
    @Operation(description = "Lista os riscos de projeto disponíveis")
    @PreAuthorize("permitAll()")
    public ResponseEntity<List<RiscoProjetoResponseDTO>> listarRiscosProjeto() {
        return ResponseEntity.ok(riscoProjetoService.listarRiscosProjeto());
    }

    @GetMapping("/{id}")
    @Operation(description = "Obtém um risco de projeto por ID")
    @PreAuthorize("permitAll()")
    public ResponseEntity<RiscoProjetoResponseDTO> buscarRiscoProjeto(@PathVariable Long id) {
        return ResponseEntity.ok(riscoProjetoService.buscarRiscoProjetoPorId(id));
    }

    @PostMapping
    @Operation(description = "Cria um risco de projeto")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<RiscoProjetoResponseDTO> criarRiscoProjeto(
            @Valid @RequestBody RiscoProjetoRequestDTO requestDTO) {
        return ResponseEntity.status(HttpStatus.CREATED).body(riscoProjetoService.criarRiscoProjeto(requestDTO));
    }

    @PutMapping("/{id}")
    @Operation(description = "Atualiza um risco de projeto")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<RiscoProjetoResponseDTO> atualizarRiscoProjeto(
            @PathVariable Long id,
            @Valid @RequestBody RiscoProjetoRequestDTO requestDTO) {
        return ResponseEntity.ok(riscoProjetoService.atualizarRiscoProjeto(id, requestDTO));
    }

    @DeleteMapping("/{id}")
    @Operation(description = "Exclui um risco de projeto não associado a projetos")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<Void> deletarRiscoProjeto(@PathVariable Long id) {
        riscoProjetoService.deletarRiscoProjeto(id);
        return ResponseEntity.noContent().build();
    }
}
