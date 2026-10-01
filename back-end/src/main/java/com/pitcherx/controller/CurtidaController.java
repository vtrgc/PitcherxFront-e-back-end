package com.pitcherx.controller;

import com.pitcherx.service.CurtidaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/curtida")
@Tag(name = "Curtida", description = "Endpoints relacionados a curtidas")
public class CurtidaController {

    private final CurtidaService curtidaService;

    public CurtidaController(CurtidaService curtidaService) {
        this.curtidaService = curtidaService;
    }

    @GetMapping("/contar-curtidas/{tipoConteudoId}/{conteudoId}")
    @Operation(summary = "Endpoint para contar curtidas de um conteúdo", description = "Este endpoint permite contar o número de curtidas de um conteúdo específico, " +
            "como uma postagem, comentário ou subcomentário. O usuário deve fornecer o ID do tipo de conteúdo e o ID do conteúdo para obter a contagem de curtidas.")
    @PreAuthorize("hasAnyRole('ADMIN', 'USUARIO', 'EMPRESA')")
    public ResponseEntity<Integer> contarCurtidas(@PathVariable Long tipoConteudoId, @PathVariable Long conteudoId) {
        Integer quantidadeCurtidas = curtidaService.contarCurtidasPorConteudo(tipoConteudoId, conteudoId);
        return ResponseEntity.ok(quantidadeCurtidas);
    }

    @GetMapping("/status/{usuarioId}/{tipoConteudoId}/{conteudoId}")
    @Operation(summary = "Endpoint para verificar o status da curtida de um usuário em um conteúdo", description = "Retorna se o usuário já curtiu o conteúdo e a quantidade total de curtidas do conteúdo.")
    @PreAuthorize("hasAnyRole('ADMIN', 'USUARIO', 'EMPRESA')")
    public ResponseEntity<Map<String, Object>> verificarStatusCurtida(@PathVariable Long usuarioId,
                                                                     @PathVariable Long tipoConteudoId,
                                                                     @PathVariable Long conteudoId) {
        Map<String, Object> statusCurtida = curtidaService.consultarStatusCurtida(usuarioId, tipoConteudoId, conteudoId);
        return ResponseEntity.ok(statusCurtida);
    }

    @PostMapping("/{usuarioId}/{tipoConteudoId}/{conteudoId}")
    @Operation(summary = "Endpoint para curtir um conteúdo", description = "Este endpoint permite que um usuário curta um conteúdo específico, " +
            "como uma postagem, comentário ou subcomentário. O usuário deve fornecer seu ID e o ID do tipo de conteúdo que deseja curtir.")
    @PreAuthorize("hasAnyRole('ADMIN', 'USUARIO', 'EMPRESA')")
    public ResponseEntity<Long> saveCurtida(@PathVariable Long usuarioId,
                                                           @PathVariable Long tipoConteudoId,
                                                           @PathVariable Long conteudoId){
        Long curtidaId = curtidaService.curtirConteudo(usuarioId, tipoConteudoId, conteudoId);
        return ResponseEntity.status(HttpStatus.CREATED).body(curtidaId);
    }

    @DeleteMapping("/{usuarioId}/{tipoConteudoId}/{conteudoId}")
    @Operation(summary = "Endpoint para remover a curtida de um usuário em um conteúdo", description = "Remove a curtida do usuário informando usuário, tipo de conteúdo e ID do conteúdo específico.")
    @PreAuthorize("hasAnyRole('ADMIN', 'USUARIO', 'EMPRESA')")
    public ResponseEntity<Void> deleteCurtida(@PathVariable Long usuarioId,
                                            @PathVariable Long tipoConteudoId,
                                            @PathVariable Long conteudoId){
        curtidaService.removerCurtidaPorUsuarioConteudo(usuarioId, tipoConteudoId, conteudoId);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @DeleteMapping("/remover-curtida/{id}")
    @Operation(summary = "Endpoint para remover uma curtida pelo ID", description = "Este endpoint permite que um usuário remova uma curtida específica pelo ID da curtida.")
    @PreAuthorize("hasAnyRole('ADMIN', 'USUARIO', 'EMPRESA')")
    public ResponseEntity<Void> deleteCurtidaPorId(@PathVariable Long id){
        curtidaService.deletarCurtida(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

}
