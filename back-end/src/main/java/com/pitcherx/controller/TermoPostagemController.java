package com.pitcherx.controller;

import com.pitcherx.dto.termoPostagem.TermoPostagemRequestDTO;
import com.pitcherx.dto.termoPostagem.TermoPostagemResponseDTO;
import com.pitcherx.service.TermoPostagemService;
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
@RequestMapping("/termo-postagem")
@Tag(name = "Termo de Postagem", description = "Endpoints para gerenciamento dos termos de postagem.")
public class TermoPostagemController {

    private final TermoPostagemService termoPostagemService;

    public TermoPostagemController(TermoPostagemService termoPostagemService) {
        this.termoPostagemService = termoPostagemService;
    }

    @GetMapping
    @Operation(description = "Endpoint para listar os termos de postagem disponíveis.")
    @PreAuthorize("permitAll()")
    public ResponseEntity<List<TermoPostagemResponseDTO>> getTermosPostagem() {
        return ResponseEntity.status(HttpStatus.OK).body(termoPostagemService.listarTermosPostagem());
    }

    @GetMapping("/{id}")
    @Operation(description = "Endpoint para buscar um termo de postagem específico por ID.")
    @PreAuthorize("permitAll()")
    public ResponseEntity<TermoPostagemResponseDTO> getTermoPostagemById(@PathVariable Long id) {
        return ResponseEntity.status(HttpStatus.OK).body(termoPostagemService.buscarTermoPostagemPorId(id));
    }

    @PostMapping
    @Operation(description = "Endpoint para criar um novo termo de postagem.")
    @PreAuthorize("hasAnyRole('USUARIO', 'EMPRESA')")
    public ResponseEntity<TermoPostagemResponseDTO> criarTermoPostagem(@Valid @RequestBody TermoPostagemRequestDTO termoPostagemRequestDTO){
        TermoPostagemResponseDTO termoPostagemResponseDTO = termoPostagemService.criarTermoPostagem(termoPostagemRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(termoPostagemResponseDTO);
    }

    @PutMapping("/{id}")
    @Operation(description = "Endpoint para atualizar um termo de postagem existente por ID.")
    @PreAuthorize("hasAnyRole('USUARIO', 'EMPRESA')")
    public ResponseEntity<TermoPostagemResponseDTO> atualizarTermoPostagem(@PathVariable Long id, @Valid @RequestBody TermoPostagemRequestDTO termoPostagemRequestDTO){
        TermoPostagemResponseDTO termoPostagemResponseDTO = termoPostagemService.atualizarTermoPostagem(id, termoPostagemRequestDTO);
        return ResponseEntity.status(HttpStatus.OK).body(termoPostagemResponseDTO);
    }

    @DeleteMapping("/{id}")
    @Operation(description = "Endpoint para excluir um termo de postagem por ID.")
    @PreAuthorize("hasAnyRole('USUARIO', 'EMPRESA', 'ADMIN')")
    public ResponseEntity<Void> excluirTermoPostagem(@PathVariable Long id) {
        termoPostagemService.deletarTermoPostagem(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

}
