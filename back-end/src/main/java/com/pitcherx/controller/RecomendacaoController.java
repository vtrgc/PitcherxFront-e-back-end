package com.pitcherx.controller;

import com.pitcherx.dto.ProjetoResumoDTO;
import com.pitcherx.model.Projeto;
import com.pitcherx.model.Usuario;
import com.pitcherx.service.RecomendacaoProjetoService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/recomendacoes")
public class RecomendacaoController {

    private final RecomendacaoProjetoService recomendacaoService;

    public RecomendacaoController(RecomendacaoProjetoService recomendacaoService) {
        this.recomendacaoService = recomendacaoService;
    }

    @GetMapping("/projetos/{userId}")
    public ResponseEntity<List<ProjetoResumoDTO>> recomendarProjetos(
            @PathVariable Long userId,
            @AuthenticationPrincipal Usuario usuario) {

        Map<Projeto, Double> scores = recomendacaoService.recomendarPorAreaSubstring(userId);
        List<Projeto> projetos = recomendacaoService.ordenarPorScore(scores);

        List<ProjetoResumoDTO> dtoList = projetos.stream()
                .limit(10)
                .map(p -> {
                    ProjetoResumoDTO dto = new ProjetoResumoDTO();
                    dto.setIdProjeto(p.getIdProjeto());
                    dto.setNomeProjeto(p.getNomeProjeto());
                    dto.setDescricaoProjeto(p.getDescricaoProjeto());
                    dto.setVisualizacoes((double) p.getVisualizacoes());
                    dto.setSeguidores((double) p.getSeguidores());
                    dto.setMetaFinanceira(p.getMetaFinanceira());

                    Usuario criador = p.getUsuarioCriador();
                    if (criador != null) {
                        dto.setNomeCriador(criador.getNomeUsuario());
                    } else {
                        dto.setNomeCriador("Desconhecido");
                    }

                    Double score = scores.get(p);
                    dto.setScoreRelevancia(score != null ? score : 0.0);
                    return dto;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtoList);
    }
}