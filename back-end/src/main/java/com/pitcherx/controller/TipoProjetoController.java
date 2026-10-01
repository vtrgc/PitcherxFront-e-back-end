package com.pitcherx.controller;

import com.pitcherx.dto.tipoProjeto.TipoProjetoRequestDTO;
import com.pitcherx.dto.tipoProjeto.TipoProjetoResponseDTO;
import com.pitcherx.service.TipoProjetoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tipo-projeto")
@Tag(name = "Tipo de projeto", description = "Endpoints para gerenciamento de tipos de projeto")
public class TipoProjetoController {

    private final TipoProjetoService tipoProjetoService;

    public TipoProjetoController(TipoProjetoService tipoProjetoService) {
        this.tipoProjetoService = tipoProjetoService;
    }

    @GetMapping
    @Operation(description = "Endpoint para listar os tipos de projeto disponíveis")
    @PreAuthorize("permitAll()")
    public ResponseEntity<List<TipoProjetoResponseDTO>> getTiposProjeto() {
        return ResponseEntity.status(HttpStatus.OK).body(tipoProjetoService.listarTiposProjeto());
    }

    @GetMapping("/{id}")
    @Operation(description = "Endpoint para obter um tipo de projeto específico por ID")
    @PreAuthorize("permitAll()")
    public ResponseEntity<TipoProjetoResponseDTO> getTipoProjetoById(@PathVariable Long id) {
        return ResponseEntity.status(HttpStatus.OK).body(tipoProjetoService.buscarTipoProjetoPorId(id));
    }

    @PostMapping
    @Operation(description = "Endpoint para criar um novo tipo de projeto")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<TipoProjetoResponseDTO> createTipoProjeto(@Valid @RequestBody TipoProjetoRequestDTO tipoProjetoRequestDTO) {
        TipoProjetoResponseDTO tipoProjetoResponseDTO = tipoProjetoService.criarTipoProjeto(tipoProjetoRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(tipoProjetoResponseDTO);
    }

    @PutMapping("/{id}")
    @Operation(description = "Endpoint para atualizar um tipo de projeto existente")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<TipoProjetoResponseDTO> updateTipoProjeto(@PathVariable Long id, @Valid @RequestBody TipoProjetoRequestDTO tipoProjetoRequestDTO) {
        TipoProjetoResponseDTO tipoProjetoResponseDTO = tipoProjetoService.atualizarTipoProjeto(id, tipoProjetoRequestDTO);
        return ResponseEntity.status(HttpStatus.OK).body(tipoProjetoResponseDTO);
    }

    @DeleteMapping("/{id}")
    @Operation(description = "Endpoint para excluir um tipo de projeto por ID")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<Void> deleteTipoProjeto(@PathVariable Long id) {
        tipoProjetoService.deletarTipoProjeto(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

}
