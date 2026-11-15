package com.pitcherx.controller;

import com.pitcherx.dto.projetoUsuario.ProjetoUsuarioRequestDTO;
import com.pitcherx.dto.projetoUsuario.ProjetoUsuarioResponseDTO;
import com.pitcherx.service.ProjetoUsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/projeto-usuario")
@Tag(name = "ProjetoUsuario", description = "Endpoints para gerenciamento de vínculos entre projetos e usuários")
public class ProjetoUsuarioController {

    private final ProjetoUsuarioService projetoUsuarioService;

    public ProjetoUsuarioController(ProjetoUsuarioService projetoUsuarioService) {
        this.projetoUsuarioService = projetoUsuarioService;
    }

    @GetMapping("/projeto/{idProjeto}")
    @PreAuthorize("permitAll()")
    @Operation(description = "Endpoint para listar os usuários vinculados a um projeto")
    public ResponseEntity<List<ProjetoUsuarioResponseDTO>> getPorProjeto(@PathVariable Long idProjeto) {
        return ResponseEntity.status(HttpStatus.OK).body(projetoUsuarioService.listarPorProjeto(idProjeto));
    }

    @GetMapping("/usuario/{idUsuario}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USUARIO', 'EMPRESA')")
    @Operation(description = "Endpoint para listar os projetos vinculados a um usuário")
    public ResponseEntity<List<ProjetoUsuarioResponseDTO>> getPorUsuario(@PathVariable Long idUsuario) {
        return ResponseEntity.status(HttpStatus.OK).body(projetoUsuarioService.listarPorUsuario(idUsuario));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USUARIO', 'EMPRESA')")
    @Operation(description = "Endpoint para obter um vínculo específico por ID")
    public ResponseEntity<ProjetoUsuarioResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.status(HttpStatus.OK).body(projetoUsuarioService.buscarPorId(id));
    }

    // POST removido: vinculações agora são feitas via solicitações de vínculo (SolicitacaoVinculoController)
    // ou automaticamente ao aceitar termos (TermoVinculoController) ou criar projeto (ProjetoController)
}
