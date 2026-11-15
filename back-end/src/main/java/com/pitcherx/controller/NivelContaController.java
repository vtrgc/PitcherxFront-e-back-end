package com.pitcherx.controller;

import com.pitcherx.dto.nivelconta.NivelContaResponseDTO;
import com.pitcherx.service.NivelContaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/nivel-conta")
@RequiredArgsConstructor
@Tag(name = "Nível de Conta", description = "Endpoints para listagem de níveis de conta")
@SecurityRequirement(name = "bearerAuth")
public class NivelContaController {

    private final NivelContaService nivelContaService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Listar todos os níveis de conta disponíveis")
    public ResponseEntity<List<NivelContaResponseDTO>> listarNiveis() {
        return ResponseEntity.ok(nivelContaService.listarNiveis());
    }
}
