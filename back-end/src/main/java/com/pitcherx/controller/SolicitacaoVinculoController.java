package com.pitcherx.controller;

import com.pitcherx.dto.solicitacaoVinculo.SolicitacaoVinculoRequestDTO;
import com.pitcherx.dto.solicitacaoVinculo.SolicitacaoVinculoResponseDTO;
import com.pitcherx.mapper.SolicitacaoVinculoMapper;
import com.pitcherx.model.Projeto;
import com.pitcherx.model.SolicitacaoVinculo;
import com.pitcherx.model.Usuario;
import com.pitcherx.service.SolicitacaoVinculoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/solicitacao-vinculo")
@Tag(name = "Solicitação de Vínculo", description = "Endpoints para solicitações de mudança de vínculo entre projetos e usuários")
public class SolicitacaoVinculoController {

    private final SolicitacaoVinculoService solicitacaoVinculoService;
    private final SolicitacaoVinculoMapper solicitacaoVinculoMapper;

    public SolicitacaoVinculoController(SolicitacaoVinculoService solicitacaoVinculoService,
                                        SolicitacaoVinculoMapper solicitacaoVinculoMapper) {
        this.solicitacaoVinculoService = solicitacaoVinculoService;
        this.solicitacaoVinculoMapper = solicitacaoVinculoMapper;
    }

    @GetMapping("/projeto/{projetoId}")
    @Operation(description = "Lista todas as solicitações de vínculo de um projeto.")
    @PreAuthorize("hasAnyRole('ADMIN', 'USUARIO', 'EMPRESA')")
    public ResponseEntity<List<SolicitacaoVinculoResponseDTO>> listarPorProjeto(@PathVariable Long projetoId) {
        return ResponseEntity.status(HttpStatus.OK).body(solicitacaoVinculoService.listarPorProjeto(projetoId));
    }

    @GetMapping("/projeto/{projetoId}/pendentes")
    @Operation(description = "Lista solicitações pendentes de um projeto (apenas para criador).")
    @PreAuthorize("hasAnyRole('ADMIN', 'USUARIO', 'EMPRESA')")
    public ResponseEntity<List<SolicitacaoVinculoResponseDTO>> listarPendentesPorProjeto(@PathVariable Long projetoId) {
        return ResponseEntity.status(HttpStatus.OK).body(solicitacaoVinculoService.listarPendentesPorProjeto(projetoId));
    }

    @GetMapping("/minhas-solicitacoes")
    @Operation(description = "Lista todas as solicitações do usuário logado para qualquer projeto.")
    @PreAuthorize("permitAll()")
    public ResponseEntity<List<SolicitacaoVinculoResponseDTO>> minhasSolicitacoes(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.status(HttpStatus.OK).body(solicitacaoVinculoService.listarPorSolicitante(usuario.getIdUsuario()));
    }

    @PostMapping("/projeto/{projetoId}")
    @Operation(description = "Usuário solicita mudar de vínculo (SOCIO ou INVESTIDOR).")
    @PreAuthorize("permitAll()")
    public ResponseEntity<SolicitacaoVinculoResponseDTO> solicitarVinculo(@PathVariable Long projetoId,
                                                                        @Valid @RequestBody SolicitacaoVinculoRequestDTO dto,
                                                                        @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.status(HttpStatus.CREATED).body(solicitacaoVinculoService.solicitarVinculo(projetoId, usuario.getIdUsuario(), dto.tipoVinculoDesejadoId()));
    }

    @PutMapping("/{id}/aprovar")
    @Operation(description = "Criador do projeto aprova a solicitação.")
    @PreAuthorize("hasAnyRole('ADMIN', 'USUARIO', 'EMPRESA')")
    public ResponseEntity<SolicitacaoVinculoResponseDTO> aprovarSolicitacao(@PathVariable Long id,
                                                                            @RequestParam(required = false) Long usuarioIdCriador,
                                                                            @AuthenticationPrincipal Usuario usuarioLogado) {
        // O criador é sempre o usuário do token (o parâmetro antigo é ignorado: aceitar um id
        // vindo da URL permitia que qualquer conta decidisse pelo criador).
        return ResponseEntity.status(HttpStatus.OK).body(solicitacaoVinculoService.aprovarSolicitacao(id, usuarioLogado.getIdUsuario()));
    }

    @PutMapping("/{id}/rejeitar")
    @Operation(description = "Criador do projeto rejeita a solicitação.")
    @PreAuthorize("hasAnyRole('ADMIN', 'USUARIO', 'EMPRESA')")
    public ResponseEntity<SolicitacaoVinculoResponseDTO> rejeitarSolicitacao(@PathVariable Long id,
                                                                            @RequestParam(required = false) Long usuarioIdCriador,
                                                                            @AuthenticationPrincipal Usuario usuarioLogado) {
        // O criador é sempre o usuário do token (o parâmetro antigo é ignorado: aceitar um id
        // vindo da URL permitia que qualquer conta decidisse pelo criador).
        return ResponseEntity.status(HttpStatus.OK).body(solicitacaoVinculoService.rejeitarSolicitacao(id, usuarioLogado.getIdUsuario()));
    }
}