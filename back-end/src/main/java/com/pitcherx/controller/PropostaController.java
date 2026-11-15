package com.pitcherx.controller;

import com.pitcherx.dto.proposta.PropostaRequestDTO;
import com.pitcherx.dto.proposta.PropostaResponseDTO;
import com.pitcherx.model.Usuario;
import com.pitcherx.service.PropostaService;
import io.swagger.v3.oas.annotations.Operation;
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
@RequestMapping("/proposta")
@RequiredArgsConstructor
@Tag(name = "Proposta", description = "Endpoints para gerenciamento de propostas")
@SecurityRequirement(name = "bearerAuth")
public class PropostaController {

    private final PropostaService propostaService;

    @GetMapping
    @PreAuthorize("permitAll()")
    @Operation(summary = "Listar Propostas", description = "Retorna uma lista de todas as propostas cadastradas")
    public ResponseEntity<List<PropostaResponseDTO>> getPropostas(){
        return ResponseEntity.status(HttpStatus.OK).body(propostaService.listarPropostas());
    }

    @GetMapping("/{id}")
    @PreAuthorize("permitAll()")
    @Operation(summary = "Buscar Proposta por ID", description = "Retorna uma proposta específica com base no ID fornecido")
    public ResponseEntity<PropostaResponseDTO> getPropostaById(@PathVariable Long id){
        return ResponseEntity.status(HttpStatus.OK).body(propostaService.buscarPropostaPorId(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('USUARIO', 'EMPRESA', 'ADMIN')")
    @Operation(summary = "Criar Proposta", description = "Cria uma nova proposta com base nos dados fornecidos")
    public ResponseEntity<PropostaResponseDTO> saveProposta(@Valid @RequestBody PropostaRequestDTO propostaRequestDTO,
                                                            @AuthenticationPrincipal Usuario usuarioLogado){
        PropostaResponseDTO propostaResponseDTO = propostaService.criarProposta(propostaRequestDTO, usuarioLogado);
        return ResponseEntity.status(HttpStatus.CREATED).body(propostaResponseDTO);
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Atualizar Proposta", description = "Atualiza uma proposta (apenas o dono, se não houver contraproposta pendente)")
    public ResponseEntity<PropostaResponseDTO> updateProposta(@PathVariable Long id,
                                                              @Valid @RequestBody PropostaRequestDTO propostaRequestDTO,
                                                              @AuthenticationPrincipal Usuario usuarioLogado){
        PropostaResponseDTO propostaResponseDTO = propostaService.atualizarProposta(id, propostaRequestDTO, usuarioLogado);
        return ResponseEntity.status(HttpStatus.OK).body(propostaResponseDTO);
    }

    @PutMapping("/aceitar/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Aceitar Proposta", description = "Aceita uma proposta (apenas proprietário do projeto)")
    public ResponseEntity<PropostaResponseDTO> aceitarProposta(@PathVariable Long id,
                                                               @AuthenticationPrincipal Usuario usuarioLogado){
        PropostaResponseDTO propostaResponseDTO = propostaService.aceitarProposta(id, usuarioLogado);
        return ResponseEntity.status(HttpStatus.OK).body(propostaResponseDTO);
    }

    @PutMapping("/recusar/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Recusar Proposta", description = "Recusa uma proposta (apenas proprietário do projeto)")
    public ResponseEntity<PropostaResponseDTO> recusarProposta(@PathVariable Long id,
                                                               @AuthenticationPrincipal Usuario usuarioLogado){
        PropostaResponseDTO propostaResponseDTO = propostaService.recusarProposta(id, usuarioLogado);
        return ResponseEntity.status(HttpStatus.OK).body(propostaResponseDTO);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Deletar Proposta", description = "Deleta uma proposta (apenas o dono, se não houver contraproposta pendente)")
    public ResponseEntity<Void> deleteProposta(@PathVariable Long id,
                                               @AuthenticationPrincipal Usuario usuarioLogado){
        propostaService.deletarProposta(id, usuarioLogado);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @GetMapping("/projeto/{projetoId}")
    @PreAuthorize("permitAll()")
    @Operation(summary = "Listar Propostas por Projeto", description = "Retorna todas as propostas de um projeto específico baseado no ID")
    public ResponseEntity<List<PropostaResponseDTO>> getPropostasByProjeto(@PathVariable Long projetoId){
        return ResponseEntity.status(HttpStatus.OK).body(propostaService.listarPropostasByProjeto(projetoId));
    }

}
