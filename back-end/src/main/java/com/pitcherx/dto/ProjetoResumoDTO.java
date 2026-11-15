package com.pitcherx.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ProjetoResumoDTO {
    private Long idProjeto;
    private String nomeProjeto;
    private String descricaoProjeto;
    private Double visualizacoes;
    private Double seguidores;
    private Double metaFinanceira;
    private String nomeCriador;
    private Double scoreRelevancia;
}