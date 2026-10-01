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
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "contrato")
public class Contrato {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_contrato")
    private Long idContrato;

    @Column(name = "titulo_contrato", nullable = false)
    private String tituloContrato;

    @Column(name = "descricao_contrato", nullable = false)
    private String descricaoContrato;

    @Column(name = "data_inicio_contrato", nullable = false)
    private LocalDateTime dataInicioContrato;

    @Column(name = "data_fim_contrato", nullable = false)
    private LocalDateTime dataFimContrato;

    @Column(name = "active", nullable = false)
    private Boolean active;

    @ManyToOne
    @JoinColumn(name = "id_projeto", nullable = false)
    private Projeto projeto;

}
