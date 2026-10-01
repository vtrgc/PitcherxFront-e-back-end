package com.pitcherx.controller;

import com.pitcherx.dto.conexao.ConexaoRequestDTO;
import com.pitcherx.dto.conexao.ConexaoResponseDTO;
import com.pitcherx.dto.conexao.ConexaoSimplesDTO;
import com.pitcherx.dto.conexao.StatusConexaoDTO;
import com.pitcherx.dto.notificacao.NotificacaoResponseDTO;
import com.pitcherx.model.Usuario;
import com.pitcherx.service.ConexaoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/conexao")
@Tag(name = "Conexão", description = "Endpoints para gerenciamento de conexões (estilo LinkedIn)")
public class ConexaoController {

    private final ConexaoService conexaoService;

    public ConexaoController(ConexaoService conexaoService) {
        this.conexaoService = conexaoService;
    }

    @PostMapping("/solicitar")
    @Operation(summary = "Solicitar conexão", description = "Envia uma solicitação de conexão para outro usuário (estilo LinkedIn).")
    @PreAuthorize("hasAnyRole('ADMIN', 'USUARIO', 'EMPRESA')")
    public ResponseEntity<ConexaoResponseDTO> solicitarConexao(@Valid @RequestBody ConexaoRequestDTO request,
                                                                @AuthenticationPrincipal Usuario usuario) {
        ConexaoResponseDTO response = conexaoService.solicitarConexao(usuario.getIdUsuario(), request.seguidoId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/solicitar/{seguidoId}")
    @Operation(summary = "Solicitar conexão por ID", description = "Envia uma solicitação de conexão para outro usuário.")
    @PreAuthorize("hasAnyRole('ADMIN', 'USUARIO', 'EMPRESA')")
    public ResponseEntity<ConexaoResponseDTO> solicitarConexaoPorId(@PathVariable Long seguidoId,
                                                                     @AuthenticationPrincipal Usuario usuario) {
        ConexaoResponseDTO response = conexaoService.solicitarConexao(usuario.getIdUsuario(), seguidoId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{conexaoId}/aceitar")
    @Operation(summary = "Aceitar solicitação de conexão", description = "Aceita uma solicitação de conexão recebida.")
    @PreAuthorize("hasAnyRole('ADMIN', 'USUARIO', 'EMPRESA')")
    public ResponseEntity<ConexaoResponseDTO> aceitarConexao(@PathVariable Long conexaoId,
                                                              @AuthenticationPrincipal Usuario usuario) {
        ConexaoResponseDTO response = conexaoService.aceitarConexao(conexaoId, usuario.getIdUsuario());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{conexaoId}/recusar")
    @Operation(summary = "Recusar solicitação de conexão", description = "Recusa uma solicitação de conexão recebida.")
    @PreAuthorize("hasAnyRole('ADMIN', 'USUARIO', 'EMPRESA')")
    public ResponseEntity<ConexaoResponseDTO> recusarConexao(@PathVariable Long conexaoId,
                                                              @AuthenticationPrincipal Usuario usuario) {
        ConexaoResponseDTO response = conexaoService.recusarConexao(conexaoId, usuario.getIdUsuario());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{conexaoId}")
    @Operation(summary = "Remover conexão", description = "Remove uma conexão existente ou cancela uma solicitação enviada.")
    @PreAuthorize("hasAnyRole('ADMIN', 'USUARIO', 'EMPRESA')")
    public ResponseEntity<Void> removerConexao(@PathVariable Long conexaoId,
                                               @AuthenticationPrincipal Usuario usuario) {
        conexaoService.removerConexao(conexaoId, usuario.getIdUsuario());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/seguidores/{usuarioId}")
    @Operation(summary = "Listar seguidores", description = "Lista os seguidores de um usuário (conexões aceitas).")
    @PreAuthorize("hasAnyRole('ADMIN', 'USUARIO', 'EMPRESA')")
    public ResponseEntity<Page<ConexaoSimplesDTO>> listarSeguidores(@PathVariable Long usuarioId,
                                                                      @PageableDefault(size = 20) Pageable pageable) {
        Page<ConexaoSimplesDTO> seguidores = conexaoService.listarSeguidores(usuarioId, pageable);
        return ResponseEntity.ok(seguidores);
    }

    @GetMapping("/seguindo/{usuarioId}")
    @Operation(summary = "Listar quem o usuário segue", description = "Lista os usuários que um usuário segue (conexões aceitas).")
    @PreAuthorize("hasAnyRole('ADMIN', 'USUARIO', 'EMPRESA')")
    public ResponseEntity<Page<ConexaoSimplesDTO>> listarSeguindo(@PathVariable Long usuarioId,
                                                                    @PageableDefault(size = 20) Pageable pageable) {
        Page<ConexaoSimplesDTO> seguindo = conexaoService.listarSeguindo(usuarioId, pageable);
        return ResponseEntity.ok(seguindo);
    }

    @GetMapping("/solicitacoes/pendentes/{usuarioId}")
    @Operation(summary = "Listar solicitações pendentes recebidas", description = "Lista as solicitações de conexão pendentes recebidas pelo usuário.")
    @PreAuthorize("hasAnyRole('ADMIN', 'USUARIO', 'EMPRESA')")
    public ResponseEntity<Page<ConexaoSimplesDTO>> listarSolicitacoesPendentes(@PathVariable Long usuarioId,
                                                                                 @PageableDefault(size = 20) Pageable pageable) {
        Page<ConexaoSimplesDTO> solicitacoes = conexaoService.listarSolicitacoesPendentes(usuarioId, pageable);
        return ResponseEntity.ok(solicitacoes);
    }

    @GetMapping("/solicitacoes/enviadas/{usuarioId}")
    @Operation(summary = "Listar solicitações enviadas", description = "Lista as solicitações de conexão enviadas pelo usuário e ainda pendentes.")
    @PreAuthorize("hasAnyRole('ADMIN', 'USUARIO', 'EMPRESA')")
    public ResponseEntity<Page<ConexaoSimplesDTO>> listarSolicitacoesEnviadas(@PathVariable Long usuarioId,
                                                                               @PageableDefault(size = 20) Pageable pageable) {
        Page<ConexaoSimplesDTO> solicitacoes = conexaoService.listarSolicitacoesEnviadas(usuarioId, pageable);
        return ResponseEntity.ok(solicitacoes);
    }

    @GetMapping("/contar-seguidores/{usuarioId}")
    @Operation(summary = "Contar seguidores", description = "Retorna a quantidade de seguidores de um usuário.")
    @PreAuthorize("hasAnyRole('ADMIN', 'USUARIO', 'EMPRESA')")
    public ResponseEntity<Map<String, Long>> contarSeguidores(@PathVariable Long usuarioId) {
        long count = conexaoService.contarSeguidores(usuarioId);
        return ResponseEntity.ok(Map.of("quantidade", count));
    }

    @GetMapping("/contar-seguindo/{usuarioId}")
    @Operation(summary = "Contar seguindo", description = "Retorna a quantidade de usuários que um usuário segue.")
    @PreAuthorize("hasAnyRole('ADMIN', 'USUARIO', 'EMPRESA')")
    public ResponseEntity<Map<String, Long>> contarSeguindo(@PathVariable Long usuarioId) {
        long count = conexaoService.contarSeguindo(usuarioId);
        return ResponseEntity.ok(Map.of("quantidade", count));
    }

    @GetMapping("/contar-solicitacoes-pendentes/{usuarioId}")
    @Operation(summary = "Contar solicitações pendentes", description = "Retorna a quantidade de solicitações de conexão pendentes recebidas.")
    @PreAuthorize("hasAnyRole('ADMIN', 'USUARIO', 'EMPRESA')")
    public ResponseEntity<Map<String, Long>> contarSolicitacoesPendentes(@PathVariable Long usuarioId) {
        long count = conexaoService.contarSolicitacoesPendentes(usuarioId);
        return ResponseEntity.ok(Map.of("quantidade", count));
    }

    @GetMapping("/status/{usuarioId}/{outroUsuarioId}")
    @Operation(summary = "Verificar status da conexão", description = "Verifica o status da conexão entre dois usuários.")
    @PreAuthorize("hasAnyRole('ADMIN', 'USUARIO', 'EMPRESA')")
    public ResponseEntity<StatusConexaoDTO> verificarStatus(@PathVariable Long usuarioId,
                                                             @PathVariable Long outroUsuarioId) {
        StatusConexaoDTO status = conexaoService.verificarStatus(usuarioId, outroUsuarioId);
        return ResponseEntity.ok(status);
    }

    @GetMapping("/notificacoes")
    @Operation(summary = "Listar notificações", description = "Lista as notificações do usuário logado.")
    @PreAuthorize("hasAnyRole('ADMIN', 'USUARIO', 'EMPRESA')")
    public ResponseEntity<Page<NotificacaoResponseDTO>> listarNotificacoes(@AuthenticationPrincipal Usuario usuario,
                                                                            @PageableDefault(size = 20) Pageable pageable) {
        Page<NotificacaoResponseDTO> notificacoes = conexaoService.listarNotificacoes(usuario.getIdUsuario(), pageable);
        return ResponseEntity.ok(notificacoes);
    }

    @GetMapping("/notificacoes/nao-lidas")
    @Operation(summary = "Contar notificações não lidas", description = "Retorna a quantidade de notificações não lidas do usuário logado.")
    @PreAuthorize("hasAnyRole('ADMIN', 'USUARIO', 'EMPRESA')")
    public ResponseEntity<Map<String, Long>> contarNaoLidas(@AuthenticationPrincipal Usuario usuario) {
        long count = conexaoService.contarNaoLidas(usuario.getIdUsuario());
        return ResponseEntity.ok(Map.of("quantidade", count));
    }

    @PutMapping("/notificacoes/{notificacaoId}/ler")
    @Operation(summary = "Marcar notificação como lida", description = "Marca uma notificação específica como lida.")
    @PreAuthorize("hasAnyRole('ADMIN', 'USUARIO', 'EMPRESA')")
    public ResponseEntity<Void> marcarComoLida(@PathVariable Long notificacaoId,
                                                @AuthenticationPrincipal Usuario usuario) {
        conexaoService.marcarComoLida(notificacaoId, usuario.getIdUsuario());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/notificacoes/ler-todas")
    @Operation(summary = "Marcar todas as notificações como lidas", description = "Marca todas as notificações do usuário logado como lidas.")
    @PreAuthorize("hasAnyRole('ADMIN', 'USUARIO', 'EMPRESA')")
    public ResponseEntity<Void> marcarTodasComoLidas(@AuthenticationPrincipal Usuario usuario) {
        conexaoService.marcarTodasComoLidas(usuario.getIdUsuario());
        return ResponseEntity.noContent().build();
    }
}