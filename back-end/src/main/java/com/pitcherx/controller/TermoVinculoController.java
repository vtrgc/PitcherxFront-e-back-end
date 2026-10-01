package com.pitcherx.controller;

import com.pitcherx.dto.termoVinculo.TermoVinculoRequestDTO;
import com.pitcherx.dto.termoVinculo.TermoVinculoResponseDTO;
import com.pitcherx.service.TermoVinculoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/termo-vinculo")
@Tag(name = "Termo de vínculo", description = "Endpoints para gerenciamento dos termos de vinculos.")
public class TermoVinculoController {

    private final TermoVinculoService termoVinculoService;

    public TermoVinculoController(TermoVinculoService termoVinculoService) {
        this.termoVinculoService = termoVinculoService;
    }

    @GetMapping
    @Operation(description = "Este endpoint é responsável por listar os termos de vínculo disponíveis.")
    @PreAuthorize("permitAll()")
    public ResponseEntity<List<TermoVinculoResponseDTO>> getTermosVinculo() {
        return ResponseEntity.status(HttpStatus.OK).body(termoVinculoService.listarTermosVinculo());
    }

    @GetMapping("/{id}")
    @Operation(description = "Este endpoint é responsável por buscar um termo de vínculo específico por ID.")
    @PreAuthorize("permitAll()")
    public ResponseEntity<TermoVinculoResponseDTO> getTermoVinculoById(@PathVariable Long id) {
        return ResponseEntity.status(HttpStatus.OK).body(termoVinculoService.buscarTermoVinculoPorId(id));
    }

    @PostMapping
    @Operation(description = "Este endpoint é responsável por criar um novo termo de vínculo.")
    @PreAuthorize("hasAnyRole('USUARIO', 'EMPRESA')")
        public ResponseEntity<TermoVinculoResponseDTO> criarTermoVinculo(@Valid @RequestBody TermoVinculoRequestDTO termoVinculoRequestDTO){
        TermoVinculoResponseDTO termoVinculoResponseDTO = termoVinculoService.criarTermoVinculo(termoVinculoRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(termoVinculoResponseDTO);
    }

    @PutMapping("/{id}")
    @Operation(description = "Este endpoint é responsável por atualizar um termo de vínculo existente por ID.")
    @PreAuthorize("hasAnyRole('USUARIO', 'EMPRESA')")
    public ResponseEntity<TermoVinculoResponseDTO> atualizarTermoVinculo(@PathVariable Long id, @Valid @RequestBody TermoVinculoRequestDTO termoVinculoRequestDTO) {
        TermoVinculoResponseDTO termoVinculoResponseDTO = termoVinculoService.atualizarTermoVinculo(id, termoVinculoRequestDTO);
        return ResponseEntity.status(HttpStatus.OK).body(termoVinculoResponseDTO);
    }

    @DeleteMapping("/{id}")
    @Operation(description = "Este endpoint é responsável por excluir um termo de vínculo por ID.")
    @PreAuthorize("hasAnyRole('USUARIO', 'EMPRESA', 'ADMIN')")
    public ResponseEntity<Void> excluirTermoVinculo(@PathVariable Long id) {
        termoVinculoService.deletarTermoVinculo(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }


}
