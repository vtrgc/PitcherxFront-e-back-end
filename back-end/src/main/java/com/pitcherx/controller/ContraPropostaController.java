package com.pitcherx.controller;

import com.pitcherx.dto.contraProposta.ContraPropostaDecisionDTO;
import com.pitcherx.dto.contraProposta.ContraPropostaRequestDTO;
import com.pitcherx.dto.contraProposta.ContraPropostaResponseDTO;
import com.pitcherx.model.Usuario;
import com.pitcherx.service.ContraPropostaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/contra-proposta")
@RequiredArgsConstructor
@Tag(name = "Contra Proposta", description = "Endpoints para gerenciamento de contra propostas")
@SecurityRequirement(name = "bearerAuth")
public class ContraPropostaController {

    private final ContraPropostaService contraPropostaService;

    @GetMapping
    @PreAuthorize("permitAll()")
    @Operation(summary = "Listar Contra Propostas", description = "Retorna uma lista de todas as contra propostas cadastradas")
    public ResponseEntity<List<ContraPropostaResponseDTO>> getContraProposta() {
        return ResponseEntity.status(HttpStatus.OK).body(contraPropostaService.listarContraPropostas());
    }

    @GetMapping("/{id}")
    @PreAuthorize("permitAll()")
    @Operation(summary = "Buscar Contra Proposta por ID", description = "Retorna uma contra proposta específica com base no ID fornecido")
    public ResponseEntity<ContraPropostaResponseDTO> getContraPropostaById(@PathVariable Long id) {
        return ResponseEntity.status(HttpStatus.OK).body(contraPropostaService.buscarContraPropostaPorId(id));
    }

    @GetMapping("/projeto/{projetoId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Listar contra propostas de um projeto", description = "Retorna todas as contra propostas de um projeto específico")
    public ResponseEntity<List<ContraPropostaResponseDTO>> listarPorProjeto(@PathVariable Long projetoId) {
        return ResponseEntity.status(HttpStatus.OK).body(contraPropostaService.listarContraPropostasPorProjeto(projetoId));
    }

    @GetMapping("/me/criadas")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Listar minhas contra propostas criadas", description = "Retorna as contra propostas criadas pelo usuário logado")
    public ResponseEntity<List<ContraPropostaResponseDTO>> listarMinhasCriadas(@AuthenticationPrincipal Usuario usuarioLogado) {
        return ResponseEntity.status(HttpStatus.OK).body(contraPropostaService.listarMinhasContraPropostasCriadas(usuarioLogado.getIdUsuario()));
    }

    @GetMapping("/me/recebidas")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Listar contra propostas recebidas", description = "Retorna as contra propostas recebidas nas propostas do usuário logado")
    public ResponseEntity<List<ContraPropostaResponseDTO>> listarMinhasRecebidas(@AuthenticationPrincipal Usuario usuarioLogado) {
        return ResponseEntity.status(HttpStatus.OK).body(contraPropostaService.listarContraPropostasRecebidas(usuarioLogado.getIdUsuario()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('USUARIO', 'EMPRESA')")
    @Operation(summary = "Criar Contra Proposta", description = "Cria uma nova contra proposta (apenas proprietário do projeto)")
    public ResponseEntity<ContraPropostaResponseDTO> saveContraProposta(
            @Valid @RequestBody ContraPropostaRequestDTO contraPropostaRequestDTO,
            @AuthenticationPrincipal Usuario usuarioLogado) {
        ContraPropostaResponseDTO response = contraPropostaService.criarContraProposta(contraPropostaRequestDTO, usuarioLogado);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('USUARIO', 'EMPRESA')")
    @Operation(summary = "Atualizar Contra Proposta", description = "Atualiza uma contra proposta pendente (apenas quem criou)")
    public ResponseEntity<ContraPropostaResponseDTO> updateContraProposta(
            @PathVariable Long id,
            @Valid @RequestBody ContraPropostaRequestDTO contraPropostaRequestDTO,
            @AuthenticationPrincipal Usuario usuarioLogado) {
        ContraPropostaResponseDTO response = contraPropostaService.atualizarContraProposta(id, contraPropostaRequestDTO, usuarioLogado);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @PutMapping("/{id}/aceitar")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Aceitar Contra Proposta", description = "Aceita uma contraproposta pendente (apenas dono da proposta original)")
    public ResponseEntity<ContraPropostaResponseDTO> aceitarContraProposta(
            @PathVariable Long id,
            @Valid @RequestBody ContraPropostaDecisionDTO decisionDTO,
            @AuthenticationPrincipal Usuario usuarioLogado) {
        ContraPropostaResponseDTO response = contraPropostaService.aceitarContraProposta(id, decisionDTO, usuarioLogado);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @PutMapping("/{id}/rejeitar")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Rejeitar Contra Proposta", description = "Rejeita uma contraproposta pendente com justificativa (apenas dono da proposta original)")
    public ResponseEntity<ContraPropostaResponseDTO> rejeitarContraProposta(
            @PathVariable Long id,
            @Valid @RequestBody ContraPropostaDecisionDTO decisionDTO,
            @AuthenticationPrincipal Usuario usuarioLogado) {
        ContraPropostaResponseDTO response = contraPropostaService.rejeitarContraProposta(id, decisionDTO, usuarioLogado);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Deletar Contra Proposta", description = "Deleta uma contra proposta (apenas quem criou ou admin)")
    public ResponseEntity<Void> deleteContraProposta(
            @PathVariable Long id,
            @AuthenticationPrincipal Usuario usuarioLogado) {
        contraPropostaService.deletarContraProposta(id, usuarioLogado);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

}
