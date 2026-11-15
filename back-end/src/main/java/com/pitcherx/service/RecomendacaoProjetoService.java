package com.pitcherx.service;

import com.pitcherx.model.Projeto;
import com.pitcherx.model.Usuario;
import com.pitcherx.repository.ProjetoRepository;
import com.pitcherx.repository.ProjetoUsuarioRepository;
import com.pitcherx.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecomendacaoProjetoService {

    private final ProjetoRepository projetoRepository;
    private final ProjetoUsuarioRepository projetoUsuarioRepository;
    private final UsuarioRepository usuarioRepository;

    public RecomendacaoProjetoService(ProjetoRepository projetoRepository,
                                      ProjetoUsuarioRepository projetoUsuarioRepository,
                                      UsuarioRepository usuarioRepository) {
        this.projetoRepository = projetoRepository;
        this.projetoUsuarioRepository = projetoUsuarioRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public Map<Projeto, Double> recomendarPorAreaSubstring(Long usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + usuarioId));
        // Sem perfil profissional (ou sem especialidade) não há área para comparar: antes isso
        // gerava NullPointerException (500). Agora a lista de recomendações vem vazia.
        if (usuario.getPerfilUsuario() == null || usuario.getPerfilUsuario().getEspecialidade() == null) {
            return new java.util.HashMap<>();
        }

        String nomeArea = usuario.getPerfilUsuario().getEspecialidade().getNomeEspecialidade();

        List<Projeto> projetos = projetoRepository.findByTipoProjetoNomeContendo(nomeArea);

        Map<Projeto, Double> scores = new HashMap<>();

        for (Projeto p : projetos) {
            long projetosCompartilhados = projetoUsuarioRepository.existsByUsuario_IdUsuarioAndProjeto_IdProjeto(
                    usuarioId, p.getIdProjeto()) ? 1L : 0L;

            double scoreArea = 0.6;
            double scoreShared = projetosCompartilhados > 0 ? 0.4 * (1.0 / (projetosCompartilhados + 1)) : 0.0;
            double totalScore = Math.min(scoreArea + scoreShared, 1.0);

            scores.put(p, totalScore);
        }

        return scores;
    }

    public List<Projeto> ordenarPorScore(Map<Projeto, Double> scores) {
        List<Projeto> projetos = new ArrayList<>(scores.keySet());
        projetos.sort((a, b) -> {
            Double scoreA = scores.get(a);
            Double scoreB = scores.get(b);
            if (scoreA == null && scoreB == null) return 0;
            if (scoreA == null) return 1;
            if (scoreB == null) return -1;
            int cmp = scoreB.compareTo(scoreA);
            if (cmp != 0) return cmp;
            return Integer.compare(b.getVisualizacoes(), a.getVisualizacoes());
        });
        return projetos;
    }
}