package com.pitcherx.service;

import com.pitcherx.dto.nivelconta.NivelContaResponseDTO;
import com.pitcherx.model.NivelConta;
import com.pitcherx.repository.NivelContaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class NivelContaService {

    private final NivelContaRepository nivelContaRepository;

    public NivelContaService(NivelContaRepository nivelContaRepository) {
        this.nivelContaRepository = nivelContaRepository;
    }

    public List<NivelContaResponseDTO> listarNiveis() {
        return nivelContaRepository.findAllByOrderByOrdemAsc().stream()
                .map(n -> new NivelContaResponseDTO(
                        n.getIdNivelConta(),
                        n.getNome().name(),
                        n.getDescricao(),
                        n.getOrdem()
                ))
                .collect(Collectors.toList());
    }

    @Transactional
    public NivelConta buscarNivelPadrao() {
        return nivelContaRepository.findByNome(NivelConta.NivelContaNome.INICIANTE)
                .orElseThrow(() -> new RuntimeException("Nível INICIANTE não encontrado no catálogo"));
    }
}
