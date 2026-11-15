package com.pitcherx.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "solicitacao_vinculo")
public class SolicitacaoVinculo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_solicitacao_vinculo")
    private Long idSolicitacaoVinculo;

    @ManyToOne
    @JoinColumn(name = "projeto_id", nullable = false)
    private Projeto projeto;

    @ManyToOne
    @JoinColumn(name = "solicitante_id", nullable = false)
    private Usuario solicitante;

    @ManyToOne
    @JoinColumn(name = "tipo_vinculo_desejado_id", nullable = false)
    private TipoVinculo tipoVinculoDesejado;

    @Column(name = "status", nullable = false, length = 20)
    private String status = "PENDENTE";

    @Column(name = "data_solicitacao", nullable = false, updatable = false)
    private LocalDateTime dataSolicitacao = LocalDateTime.now();

    @Column(name = "data_resposta")
    private LocalDateTime dataResposta;
}