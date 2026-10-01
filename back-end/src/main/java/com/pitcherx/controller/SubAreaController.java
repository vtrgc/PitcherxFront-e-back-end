package com.pitcherx.controller;

import com.pitcherx.dto.subArea.SubAreaRequestDTO;
import com.pitcherx.dto.subArea.SubAreaResponseDTO;
import com.pitcherx.service.SubAreaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/subarea")
@Tag(name = "SubÁrea", description = "Endpoints para gerenciamento de subáreas.")
public class SubAreaController {

    private final SubAreaService subAreaService;

    public SubAreaController(SubAreaService subAreaService) {
        this.subAreaService = subAreaService;
    }

    @GetMapping
    @Operation(description = "Este endpoint faz a listagem de todas as subáreas.")
    @PreAuthorize("permitAll()")
    public ResponseEntity<List<SubAreaResponseDTO>> getSubAreas() {
        return ResponseEntity.status(HttpStatus.OK).body(subAreaService.listarSubAreas());
    }

    @GetMapping("/{id}")
    @Operation(description = "Este endpoint faz a busca de subárea através do ID.")
    @PreAuthorize("permitAll()")
    public ResponseEntity<SubAreaResponseDTO> getSubAreaById(@PathVariable Long id) {
        SubAreaResponseDTO subAreaResponseDTO = subAreaService.buscarSubAreaPorId(id);
        return ResponseEntity.status(HttpStatus.OK).body(subAreaResponseDTO);
    }

    @PostMapping
    @Operation(description = "Este endpoint faz o cadastro de subárea.")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<SubAreaResponseDTO> createSubArea(@Valid @RequestBody SubAreaRequestDTO subAreaRequestDTO) {
        SubAreaResponseDTO subAreaResponseDTO = subAreaService.salvarSubArea(subAreaRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(subAreaResponseDTO);
    }

    @PutMapping("/{id}")
    @Operation(description = "Este endpoint faz a atualização de subárea através do ID.")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<SubAreaResponseDTO> updateSubArea(@PathVariable Long id, @Valid @RequestBody SubAreaRequestDTO subAreaRequestDTO){
        SubAreaResponseDTO subAreaResponseDTO = subAreaService.atualizarSubArea(id, subAreaRequestDTO);
        return ResponseEntity.status(HttpStatus.OK).body(subAreaResponseDTO);
    }

    @DeleteMapping("/{id}")
    @Operation(description = "Este endpoint faz a remoção de subárea através do ID.")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<Void> deleteSubArea(@PathVariable Long id) {
        subAreaService.deletarSubArea(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

}
