package com.pitcherx.controller;

import com.pitcherx.dto.especialidade.EspecialidadeRequestDTO;
import com.pitcherx.dto.especialidade.EspecialidadeResponseDTO;
import com.pitcherx.service.EspecialidadeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/especialidade")
@Tag(name = "Especialidade", description = "Endpoints para gerenciamento de especialidades.")
public class EspecialidadeController {

    private final EspecialidadeService especialidadeService;

    public EspecialidadeController(EspecialidadeService especialidadeService) {
        this.especialidadeService = especialidadeService;
    }

    @GetMapping
    @Operation(description = "Este endpoint faz a listagem de todas as especialidades.")
    @PreAuthorize("permitAll()")
    public ResponseEntity<List<EspecialidadeResponseDTO>> getEspecialidades() {
        return ResponseEntity.status(HttpStatus.OK).body(especialidadeService.listarEspecialidades());
    }

    @GetMapping("/{id}")
    @Operation(description = "Este endpoint faz a busca de especialidade através do ID.")
    @PreAuthorize("permitAll()")
    public ResponseEntity<EspecialidadeResponseDTO> getEspecialidadeById(@PathVariable Long id) {
        return ResponseEntity.status(HttpStatus.OK).body(especialidadeService.buscarEspecialidadePorId(id));
    }

    @PostMapping
    @Operation(description = "Este endpoint faz o cadastro de especialidade.")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<EspecialidadeResponseDTO> createEspecialidade(@Valid @RequestBody EspecialidadeRequestDTO especialidadeRequestDTO) {
        EspecialidadeResponseDTO especialidadeResponseDTO = especialidadeService.criarEspecialidade(especialidadeRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(especialidadeResponseDTO);
    }

    @PutMapping("/{id}")
    @Operation(description = "Este endpoint faz a atualização de especialidade através do ID.")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<EspecialidadeResponseDTO> updateEspecialidade(@PathVariable Long id, @Valid @RequestBody EspecialidadeRequestDTO especialidadeRequestDTO) {
        EspecialidadeResponseDTO especialidadeResponseDTO = especialidadeService.atualizarEspecialidade(id, especialidadeRequestDTO);
        return ResponseEntity.status(HttpStatus.OK).body(especialidadeResponseDTO);
    }

    @DeleteMapping("/{id}")
    @Operation(description = "Este endpoint faz a remoção de especialidade através do ID.")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<Void> deleteEspecialidade(@PathVariable Long id) {
        especialidadeService.deletarEspecialidade(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

}
