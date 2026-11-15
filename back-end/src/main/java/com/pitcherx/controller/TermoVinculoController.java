package com.pitcherx.controller;

import com.pitcherx.dto.termoVinculo.TermoVinculoRequestDTO;
import com.pitcherx.dto.termoVinculo.TermoVinculoResponseDTO;
import com.pitcherx.dto.projetoUsuario.ProjetoUsuarioResponseDTO;
import com.pitcherx.model.Projeto;
import com.pitcherx.model.Usuario;
import com.pitcherx.service.EmailService;
import com.pitcherx.service.ProjetoUsuarioService;
import com.pitcherx.service.TermoVinculoService;
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
@RequestMapping("/termo-vinculo")
@Tag(name = "Termo de vínculo", description = "Endpoints para gerenciamento dos termos de vinculos.")
public class TermoVinculoController {

    private final TermoVinculoService termoVinculoService;
    private final ProjetoUsuarioService projetoUsuarioService;
    private final EmailService emailService;

    public TermoVinculoController(TermoVinculoService termoVinculoService,
                                   ProjetoUsuarioService projetoUsuarioService,
                                   EmailService emailService) {
        this.termoVinculoService = termoVinculoService;
        this.projetoUsuarioService = projetoUsuarioService;
        this.emailService = emailService;
    }

    @GetMapping
    @Operation(description = "Este endpoint é responsável por listar os termos de vínculo disponíveis.")
    @PreAuthorize("permitAll()")
    public ResponseEntity<List<TermoVinculoResponseDTO>> getTermosVinculo() {
        return ResponseEntity.status(HttpStatus.OK).body(termoVinculoService.listarTermosVinculo());
    }

    @GetMapping("/projeto/{projetoId}")
    @Operation(description = "Este endpoint é responsável por listar os termos de vínculo por projeto.")
    @PreAuthorize("permitAll()")
    public ResponseEntity<List<TermoVinculoResponseDTO>> getTermosVinculoPorProjeto(@PathVariable Long projetoId) {
        return ResponseEntity.status(HttpStatus.OK).body(termoVinculoService.listarTermosPorProjeto(projetoId));
    }

    @GetMapping("/{id}")
    @Operation(description = "Este endpoint é responsável por buscar um termo de vínculo específico por ID.")
    @PreAuthorize("permitAll()")
    public ResponseEntity<TermoVinculoResponseDTO> getTermoVinculoById(@PathVariable Long id) {
        return ResponseEntity.status(HttpStatus.OK).body(termoVinculoService.buscarTermoVinculoPorId(id));
    }

    @PostMapping("/projeto/{projetoId}")
    @Operation(description = "Este endpoint é responsável por criar um novo termo de vínculo para um projeto.")
    @PreAuthorize("hasAnyRole('USUARIO', 'EMPRESA')")
    public ResponseEntity<TermoVinculoResponseDTO> criarTermoVinculo(@PathVariable Long projetoId, @Valid @RequestBody TermoVinculoRequestDTO termoVinculoRequestDTO){
        TermoVinculoResponseDTO termoVinculoResponseDTO = termoVinculoService.criarTermoVinculo(projetoId, termoVinculoRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(termoVinculoResponseDTO);
    }

@PostMapping("/projeto/{projetoId}/aceitar")
    @Operation(description = "Usuário aceita os termos de vinculo do projeto e passa a ser VISUALIZADOR.")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ProjetoUsuarioResponseDTO> aceitarTermos(@PathVariable Long projetoId,
                                                                 @RequestParam("termoIds") List<Long> termoIds,
                                                                @AuthenticationPrincipal Usuario usuario) {
        ProjetoUsuarioResponseDTO resultado = projetoUsuarioService.aceitarTermos(projetoId, usuario.getIdUsuario(), termoIds);
        
        // Enviar email de notificação
        try {
            String emailUsuario = usuario.getEmailUsuario();
            String nomeUsuario = usuario.getNomeUsuario();
            
            if (emailUsuario != null) {
                emailService.enviarAceiteTermoVinculo(emailUsuario, nomeUsuario, projetoId, null);
            }
        } catch (Exception e) {
            // Log error but don't fail the request
            e.printStackTrace();
        }
        
        return ResponseEntity.status(HttpStatus.CREATED).body(resultado);
    }

    @PutMapping("/{id}")
    @Operation(description = "Este endpoint é responsável por atualizar um termo de vínculo existente por ID.")
    @PreAuthorize("hasAnyRole('USUARIO', 'EMPRESA')")
    public ResponseEntity<TermoVinculoResponseDTO> atualizarTermoVinculo(@PathVariable Long id, @Valid @RequestBody TermoVinculoRequestDTO termoVinculoRequestDTO) {
        TermoVinculoResponseDTO termoVinculoResponseDTO = termoVinculoService.atualizarTermoVinculo(id, termoVinculoRequestDTO);
        return ResponseEntity.status(HttpStatus.OK).body(termoVinculoResponseDTO);
    }

    @DeleteMapping("/{id}")
    @Operation(description = "Este endpoint é responsável por excluir um termo de vínculo por ID.")
    @PreAuthorize("hasAnyRole('USUARIO', 'EMPRESA', 'ADMIN')")
    public ResponseEntity<Void> excluirTermoVinculo(@PathVariable Long id) {
        termoVinculoService.deletarTermoVinculo(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }


}
