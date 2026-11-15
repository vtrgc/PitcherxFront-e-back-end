package com.pitcherx.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.pitcherx.dto.projeto.ProjetoRequestDTO;
import com.pitcherx.dto.projeto.ProjetoResponseDTO;
import com.pitcherx.model.Usuario;
import com.pitcherx.model.Projeto;
import com.pitcherx.service.ProjetoService;
import com.pitcherx.service.ProjetoUsuarioService;
import com.pitcherx.mapper.ProjetoMapper;
import com.pitcherx.repository.ProjetoRepository;
import com.pitcherx.repository.ProjetoUsuarioRepository;
import com.pitcherx.repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/projeto")
@Tag(name = "Projeto", description = "Endpoints para gerenciamento de projetos")

public class ProjetoController {

    private final ProjetoService projetoService;
    private final ProjetoUsuarioService projetoUsuarioService;
    private final ProjetoMapper projetoMapper;
    private final ProjetoRepository projetoRepository;
    private final ProjetoUsuarioRepository projetoUsuarioRepository;
    private final UsuarioRepository usuarioRepository;

    public ProjetoController(ProjetoService projetoService, ProjetoUsuarioService projetoUsuarioService,
                             ProjetoMapper projetoMapper, ProjetoRepository projetoRepository,
                             ProjetoUsuarioRepository projetoUsuarioRepository, UsuarioRepository usuarioRepository) {
        this.projetoService = projetoService;
        this.projetoUsuarioService = projetoUsuarioService;
        this.projetoMapper = projetoMapper;
        this.projetoRepository = projetoRepository;
        this.projetoUsuarioRepository = projetoUsuarioRepository;
        this.usuarioRepository = usuarioRepository;
    }
    
    @GetMapping
    @PreAuthorize("permitAll()")
    @Operation(description = "Endpoint para listar os projetos publicados")
    public ResponseEntity<List<ProjetoResponseDTO>> getProjetos(){
        return ResponseEntity.status(HttpStatus.OK).body(projetoService.listarProjetos());
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(description = "Endpoint para obter um projeto específico por ID. Apenas usuários com vínculo aceito podem visualizar.")
    public ResponseEntity<ProjetoResponseDTO> getProjetoById(@PathVariable Long id,
            @AuthenticationPrincipal Usuario usuario) {
        Long usuarioId = usuario != null ? usuario.getIdUsuario() : null;
        return ResponseEntity.status(HttpStatus.OK).body(projetoService.buscarProjetoPorId(id, usuarioId));
    }
    
    @GetMapping("/buscar")
    @PreAuthorize("permitAll()")
    @Operation(description = "Endpoint para buscar projetos com filtros opcionais")
    public ResponseEntity<List<ProjetoResponseDTO>> buscarProjetos(
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) String descricao,
            @RequestParam(required = false) LocalDate dataInicioDe,
            @RequestParam(required = false) LocalDate dataInicioAte) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(projetoService.buscarProjetos(nome, descricao, dataInicioDe, dataInicioAte));
    }
    
    @PostMapping("/{idUsuario}")
    @PreAuthorize("hasAnyRole('USUARIO', 'EMPRESA')")
    @Operation(description = "Endpoint para criar um novo projeto")
    public ResponseEntity<ProjetoResponseDTO> createProjeto(@PathVariable Long idUsuario, @Valid @RequestBody ProjetoRequestDTO projetoRequestDTO){
        ProjetoResponseDTO projetoResponseDTO = projetoService.criarProjeto(idUsuario, projetoRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(projetoResponseDTO);
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('USUARIO', 'EMPRESA')")
    @Operation(description = "Endpoint para atualizar um projeto")
    public ResponseEntity<ProjetoResponseDTO> updateProjeto(@PathVariable Long id, @Valid @RequestBody ProjetoRequestDTO projetoRequestDTO){
        ProjetoResponseDTO projetoResponseDTO = projetoService.atualizarProjeto(id, projetoRequestDTO);
        return ResponseEntity.status(HttpStatus.OK).body(projetoResponseDTO);
    }
    
    @PatchMapping("/{id}/meta-financeira")
    @PreAuthorize("hasAnyRole('USUARIO', 'EMPRESA')")
    @Operation(description = "Endpoint para atualizar a meta financeira do projeto")
    public ResponseEntity<Double> atualizarMetaFinanceira(@PathVariable Long id, @RequestBody Double novaMeta){
        Double metaAtualizada = projetoService.atualizarMetaFinanceira(id, novaMeta);
        return ResponseEntity.status(HttpStatus.OK).body(metaAtualizada);
    }
    
    @PatchMapping("/{id}/valor-arrecadado")
    @PreAuthorize("hasAnyRole('USUARIO', 'EMPRESA')")
    @Operation(description = "Endpoint para atualizar o valor arrecadado do projeto")
    public ResponseEntity<Double> atualizarValorArrecadado(@PathVariable Long id, @RequestBody Double novoValor){
        Double valorAtualizado = projetoService.atualizarValorArrecadado(id, novoValor);
        return ResponseEntity.status(HttpStatus.OK).body(valorAtualizado);
    }

    @PutMapping(value = "/{id}/imagens", consumes = "multipart/form-data")
    @PreAuthorize("hasAnyRole('USUARIO', 'EMPRESA', 'ADMIN')")
    @Operation(summary = "Substituir imagens do projeto", description = "Envia de 1 a 10 imagens em ordem para substituir a galeria.")
    public ResponseEntity<ProjetoResponseDTO> substituirImagens(
            @PathVariable Long id,
            @RequestParam("arquivos") List<MultipartFile> arquivos,
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(projetoService.substituirImagens(id, usuario, arquivos));
    }

    @DeleteMapping("/{id}/imagens")
    @PreAuthorize("hasAnyRole('USUARIO', 'EMPRESA', 'ADMIN')")
    @Operation(summary = "Remover imagens do projeto", description = "Remove todas as imagens da galeria.")
    public ResponseEntity<Void> removerImagens(@PathVariable Long id, @AuthenticationPrincipal Usuario usuario) {
        projetoService.removerImagens(id, usuario);
        return ResponseEntity.noContent().build();
    }

    @PutMapping(value = "/{id}/videos", consumes = "multipart/form-data")
    @PreAuthorize("hasAnyRole('USUARIO', 'EMPRESA', 'ADMIN')")
    @Operation(summary = "Substituir videos do projeto", description = "Envia de 1 a 10 videos em ordem para substituir a galeria.")
    public ResponseEntity<ProjetoResponseDTO> substituirVideos(
            @PathVariable Long id,
            @RequestParam("arquivos") List<MultipartFile> arquivos,
            @AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(projetoService.substituirVideos(id, usuario, arquivos));
    }

    @DeleteMapping("/{id}/videos")
    @PreAuthorize("hasAnyRole('USUARIO', 'EMPRESA', 'ADMIN')")
    @Operation(summary = "Remover videos do projeto", description = "Remove todos os videos da galeria.")
    public ResponseEntity<Void> removerVideos(@PathVariable Long id, @AuthenticationPrincipal Usuario usuario) {
        projetoService.removerVideos(id, usuario);
        return ResponseEntity.noContent().build();
    }
    
    @PostMapping("/{id}/visualizar")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Registrar visualização de projeto (incrementa contador)")
    public ResponseEntity<Void> visualizarProjeto(@PathVariable Long id, @AuthenticationPrincipal Usuario usuario) {
        projetoService.visualizarProjeto(id, usuario.getIdUsuario());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/seguir")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Seguir projeto (incrementa contador de seguidores)")
    public ResponseEntity<Void> seguirProjeto(@PathVariable Long id, @AuthenticationPrincipal Usuario usuario) {
        projetoService.seguirProjeto(id, usuario.getIdUsuario());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USUARIO', 'EMPRESA')")
    @Operation(description = "Endpoint para deletar um projeto")
    public ResponseEntity<Void> deleteProjeto(@PathVariable Long id){
        projetoService.deletarProjeto(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
    
    @GetMapping("/usuario/{idUsuario}")
    @PreAuthorize("permitAll()")
    @Operation(description = "Endpoint para listar projetos vinculados a um usuário")
    public ResponseEntity<List<ProjetoResponseDTO>> listarProjetosPorUsuario(@PathVariable Long idUsuario) {
        if (!usuarioRepository.existsById(idUsuario)) {
            throw new EntityNotFoundException("Sem usuário com o ID informado!");
        }
        // Get user's project IDs from their vínculos
        List<Long> projetoIds = projetoUsuarioRepository.findByUsuario_IdUsuario(idUsuario).stream()
                .map(pu -> pu.getProjeto().getIdProjeto())
                .distinct()
                .toList();
        // Get all projects and filter by user's IDs
        List<Projeto> todosProjetos = projetoRepository.findAll();
        List<Projeto> projetosUsuario = todosProjetos.stream()
                .filter(p -> projetoIds.contains(p.getIdProjeto()))
                .toList();
        // Map to DTOs using the mapper
        List<ProjetoResponseDTO> dtoList = projetosUsuario.stream().map(projetoMapper::toDTO).toList();
        return ResponseEntity.status(HttpStatus.OK).body(dtoList);
    }
    
    @GetMapping("/visualizar/{idUsuario}")
    @PreAuthorize("permitAll()")
    @Operation(description = "Endpoint para listar projetos que o usuário pode visualizar")
    public ResponseEntity<List<ProjetoResponseDTO>> listarProjetosQueUsuarioPodeVisualizar(@PathVariable Long idUsuario, @AuthenticationPrincipal Usuario usuarioLogado) {
        if (!usuarioRepository.existsById(idUsuario)) {
            throw new EntityNotFoundException("Sem usuário com o ID informado!");
        }
        
        Long usuarioId = usuarioLogado != null ? usuarioLogado.getIdUsuario() : null;
        
        // Get user's vínculos filtered by access type (VISUALIZADOR, SOCIO, INVESTIDOR, CRIADOR)
        List<Long> projetoIds = projetoUsuarioRepository.findByUsuario_IdUsuario(idUsuario).stream()
                .filter(v -> {
                    String tipo = v.getTipoVinculo().getNomeTipoVinculo();
                    return tipo.equals("VISUALIZADOR") || tipo.equals("SOCIO") || tipo.equals("INVESTIDOR") || tipo.equals("CRIADOR");
                })
                .map(pu -> pu.getProjeto().getIdProjeto())
                .distinct()
                .toList();
        
        // Get all projects and filter by user's accessible project IDs
        List<Projeto> todosProjetos = projetoRepository.findAll();
        List<Projeto> projetosVisiveis = todosProjetos.stream()
                .filter(p -> projetoIds.contains(p.getIdProjeto()))
                .toList();
        
        // Se há usuário logado, validar acesso adicional
        if (usuarioId != null) {
            projetosVisiveis = projetosVisiveis.stream()
                    .filter(projeto -> {
                        try {
                            projetoService.buscarProjetoPorId(projeto.getIdProjeto(), usuarioId);
                            return true;
                        } catch (Exception e) {
                            return false;
                        }
                    })
                    .toList();
        }
        
        // Map to DTOs using the mapper
        List<ProjetoResponseDTO> dtoList = projetosVisiveis.stream().map(projetoMapper::toDTO).toList();
        return ResponseEntity.status(HttpStatus.OK).body(dtoList);
    }

}