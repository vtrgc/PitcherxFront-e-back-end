package com.pitcherx.controller;

import com.pitcherx.dto.area.AreaRequestDTO;
import com.pitcherx.dto.area.AreaResponseDTO;
import com.pitcherx.service.AreaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/area")
@Tag(name = "Area", description = "Endpoints para gerenciamento de areas.")
public class AreaController {

    private final AreaService areaService;

    public AreaController(AreaService areaService){
        this.areaService = areaService;
    }

    @GetMapping
    @PreAuthorize("permitAll()")
    @Operation(summary = "Listagem de areas", description = "Este endpoint faz a listagem de todas as areas.")
    public ResponseEntity<List<AreaResponseDTO>> getAreas(){
        return ResponseEntity.status(HttpStatus.OK).body(areaService.listarAreas());
    }

    @GetMapping("/{id}")
    @PreAuthorize("permitAll()")
    @Operation(summary = "Busca de area por ID", description = "Este endpoint faz a busca de area através do ID.")
    public ResponseEntity<AreaResponseDTO> getAreaById(@PathVariable Long id){
        return ResponseEntity.status(HttpStatus.OK).body(areaService.buscarAreaPorId(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Cadastro de area", description = "Este endpoint faz o cadastro de area.")
    public ResponseEntity<AreaResponseDTO> createArea(@Valid @RequestBody AreaRequestDTO areaRequestDTO){
        AreaResponseDTO areaResponseDTO = areaService.criarArea(areaRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(areaResponseDTO);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Atualização de area", description = "Este endpoint faz a atualização de area através do ID.")
    public ResponseEntity<AreaResponseDTO> updateArea(@PathVariable Long id, @Valid @RequestBody AreaRequestDTO areaRequestDTO){
        AreaResponseDTO areaResponseDTO = areaService.atualizarArea(id, areaRequestDTO);
        return ResponseEntity.status(HttpStatus.OK).body(areaResponseDTO);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Remover uma area", description = "Este endpoint faz a remoção de area através do ID.")
    public ResponseEntity<Void> deleteArea(@PathVariable Long id){
        areaService.deletarArea(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

}
