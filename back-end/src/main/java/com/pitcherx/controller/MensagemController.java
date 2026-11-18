package com.pitcherx.controller;

import com.pitcherx.dto.mensagem.*;
import com.pitcherx.service.MensagemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/mensagem")
@Tag(name = "Mensagens", description = "Mensagens privadas entre usuários com conexão aceita")
public class MensagemController {

    private final MensagemService mensagemService;

    public MensagemController(MensagemService mensagemService) {
        this.mensagemService = mensagemService;
    }

    @GetMapping("/conversas")
    @Operation(summary = "Listar conversas", description = "Conversas do usuário logado, da mais recente para a mais antiga, com a última mensagem e as não lidas.")
    @PreAuthorize("hasAnyRole('ADMIN', 'USUARIO', 'EMPRESA')")
    public ResponseEntity<List<ConversaResponseDTO>> listarConversas() {
        return ResponseEntity.ok(mensagemService.listarConversas());
    }

    @GetMapping("/conversas/{conversaId}")
    @Operation(summary = "Buscar conversa", description = "Uma conversa do usuário logado (403 para quem não participa).")
    @PreAuthorize("hasAnyRole('ADMIN', 'USUARIO', 'EMPRESA')")
    public ResponseEntity<ConversaResponseDTO> buscarConversa(@PathVariable Long conversaId) {
        return ResponseEntity.ok(mensagemService.buscarConversa(conversaId));
    }

    @GetMapping("/conversas/{conversaId}/mensagens")
    @Operation(summary = "Histórico de mensagens",
            description = "Sem parâmetros: as últimas mensagens. antesDe: as anteriores a uma mensagem. "
                    + "desde: o que mudou a partir do cursor devolvido na consulta anterior (atualização automática).")
    @PreAuthorize("hasAnyRole('ADMIN', 'USUARIO', 'EMPRESA')")
    public ResponseEntity<HistoricoMensagensDTO> historico(@PathVariable Long conversaId,
                                                           @RequestParam(required = false) Long antesDe,
                                                           @RequestParam(required = false) Instant desde,
                                                           @RequestParam(required = false) Integer limite) {
        return ResponseEntity.ok(mensagemService.historico(conversaId, antesDe, desde, limite));
    }

    @PostMapping
    @Operation(summary = "Enviar mensagem",
            description = "O remetente é o usuário do token. Exige conexão aceita com o destinatário. "
                    + "Repetir a chaveCliente devolve a mesma mensagem (200) em vez de criar outra (201).")
    @PreAuthorize("hasAnyRole('ADMIN', 'USUARIO', 'EMPRESA')")
    public ResponseEntity<MensagemResponseDTO> enviar(@Valid @RequestBody MensagemRequestDTO dto) {
        MensagemService.ResultadoEnvio resultado;
        try {
            resultado = mensagemService.enviar(dto);
        } catch (DataIntegrityViolationException corrida) {
            // Dois envios simultâneos com a mesma chave (ou criando a mesma conversa): o outro já
            // gravou. Devolve a mensagem existente ou tenta de novo, agora com a conversa criada.
            resultado = mensagemService.buscarPorChave(dto.chaveCliente())
                    .map(m -> new MensagemService.ResultadoEnvio(m, false))
                    .orElseGet(() -> mensagemService.enviar(dto));
        }
        return ResponseEntity.status(resultado.criada() ? HttpStatus.CREATED : HttpStatus.OK).body(resultado.mensagem());
    }

    @PutMapping("/conversas/{conversaId}/lida")
    @Operation(summary = "Marcar conversa como lida", description = "Marca como lidas as mensagens recebidas na conversa.")
    @PreAuthorize("hasAnyRole('ADMIN', 'USUARIO', 'EMPRESA')")
    public ResponseEntity<Map<String, Integer>> marcarComoLidas(@PathVariable Long conversaId) {
        return ResponseEntity.ok(Map.of("quantidade", mensagemService.marcarComoLidas(conversaId)));
    }

    @GetMapping("/nao-lidas")
    @Operation(summary = "Contar mensagens não lidas", description = "Total de mensagens recebidas e não lidas do usuário logado.")
    @PreAuthorize("hasAnyRole('ADMIN', 'USUARIO', 'EMPRESA')")
    public ResponseEntity<Map<String, Long>> contarNaoLidas() {
        return ResponseEntity.ok(Map.of("quantidade", mensagemService.contarNaoLidas()));
    }

    @GetMapping("/permissao/{usuarioId}")
    @Operation(summary = "Pode conversar?", description = "Se o usuário logado pode trocar mensagens com outro usuário e, se não, por quê.")
    @PreAuthorize("hasAnyRole('ADMIN', 'USUARIO', 'EMPRESA')")
    public ResponseEntity<PermissaoMensagemDTO> permissao(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(mensagemService.permissao(usuarioId));
    }

    @PutMapping("/{mensagemId}")
    @Operation(summary = "Editar mensagem", description = "Só quem enviou, até 15 minutos depois do envio e com a conexão ainda aceita.")
    @PreAuthorize("hasAnyRole('ADMIN', 'USUARIO', 'EMPRESA')")
    public ResponseEntity<MensagemResponseDTO> editar(@PathVariable Long mensagemId,
                                                      @Valid @RequestBody MensagemEdicaoRequestDTO dto) {
        return ResponseEntity.ok(mensagemService.editar(mensagemId, dto));
    }

    @DeleteMapping("/{mensagemId}")
    @Operation(summary = "Apagar mensagem", description = "Só quem enviou. O texto some para os dois participantes.")
    @PreAuthorize("hasAnyRole('ADMIN', 'USUARIO', 'EMPRESA')")
    public ResponseEntity<Void> excluir(@PathVariable Long mensagemId) {
        mensagemService.excluir(mensagemId);
        return ResponseEntity.noContent().build();
    }
}
