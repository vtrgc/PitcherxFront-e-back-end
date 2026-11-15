package com.pitcherx.controller;

import com.pitcherx.dto.denuncia.DenunciaAdminDecisionDTO;
import com.pitcherx.dto.denuncia.DenunciaApelacaoDTO;
import com.pitcherx.dto.denuncia.DenunciaCategoriaDTO;
import com.pitcherx.dto.denuncia.DenunciaRequestDTO;
import com.pitcherx.dto.denuncia.DenunciaResponseDTO;
import com.pitcherx.model.Usuario;
import com.pitcherx.service.DenunciaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/denuncia")
@RequiredArgsConstructor
@Tag(name = "Denúncias", description = "Endpoints para denúncias anônimas de perfis, postagens, projetos e comentários")
@SecurityRequirement(name = "bearerAuth")
public class DenunciaController {

    private final DenunciaService denunciaService;

    @PostMapping
    @PreAuthorize("hasAnyRole('USUARIO', 'EMPRESA', 'ADMIN')")
    @Operation(summary = "Criar denúncia (usuário autenticado, identidade do denunciante mantida em sigilo)")
    public ResponseEntity<DenunciaResponseDTO> criarDenuncia(
            @Valid @RequestBody DenunciaRequestDTO requestDTO,
            @AuthenticationPrincipal Usuario usuarioLogado) {
        DenunciaResponseDTO response = denunciaService.criarDenuncia(requestDTO, usuarioLogado);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Listar minhas denúncias (apenas as próprias)")
    public ResponseEntity<List<DenunciaResponseDTO>> listarMinhas(
            @AuthenticationPrincipal Usuario usuarioLogado,
            @PageableDefault(page = 0, size = 20) Pageable pageable) {
        var page = denunciaService.listarPorDenunciante(usuarioLogado.getIdUsuario(), pageable);
        return ResponseEntity.ok(page.getContent());
    }

    @GetMapping("/categorias")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Listar categorias de denúncia disponíveis por tipo de conteúdo")
    public ResponseEntity<List<DenunciaCategoriaDTO>> listarCategorias(
            @Parameter(description = "Tipo de denúncia (PERFIL, POSTAGEM, PROJETO, COMENTARIO)")
            @RequestParam(required = false) String tipoDenuncia) {
        return ResponseEntity.ok(denunciaService.listarCategorias(tipoDenuncia));
    }

    @GetMapping("/admin/pending")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Listar denúncias pendentes para revisão (apenas admin)")
    public ResponseEntity<List<DenunciaResponseDTO>> listarPendentes(
            @PageableDefault(page = 0, size = 50) Pageable pageable) {
        var page = denunciaService.listarPendentes(pageable);
        return ResponseEntity.ok(page.getContent());
    }

    @GetMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Buscar denúncia por ID (apenas admin)")
    public ResponseEntity<DenunciaResponseDTO> buscarPorId(@PathVariable Long id,
                                                           @AuthenticationPrincipal Usuario admin) {
        return ResponseEntity.ok(denunciaService.buscarPorId(id, admin));
    }

    @PutMapping("/admin/{id}/decisao")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Decidir sobre denúncia (apenas admin)")
    public ResponseEntity<DenunciaResponseDTO> decidir(
            @PathVariable Long id,
            @Valid @RequestBody DenunciaAdminDecisionDTO decisionDTO,
            @AuthenticationPrincipal Usuario admin) {
        return ResponseEntity.ok(denunciaService.decidir(id, decisionDTO, admin));
    }

    @PostMapping("/{id}/apelacao")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Solicitar apelação (apenas quando a denúncia foi aceita)")
    public ResponseEntity<DenunciaResponseDTO> solicitarApelacao(
            @PathVariable Long id,
            @Valid @RequestBody DenunciaApelacaoDTO apelacaoDTO,
            @AuthenticationPrincipal Usuario usuarioLogado) {
        return ResponseEntity.ok(denunciaService.solicitarApelacao(id, apelacaoDTO, usuarioLogado));
    }

    @PutMapping("/admin/{id}/apelacao/decisao")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Decidir apelação (apenas admin)")
    public ResponseEntity<DenunciaResponseDTO> decidirApelacao(
            @PathVariable Long id,
            @Valid @RequestBody DenunciaAdminDecisionDTO decisionDTO,
            @AuthenticationPrincipal Usuario admin) {
        return ResponseEntity.ok(denunciaService.decidirApelacao(id, decisionDTO, admin));
    }
}
