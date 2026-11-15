package com.pitcherx.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "proposta")
public class Proposta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_proposta")
    private Long idProposta;

    @Column(name = "descricao_proposta", nullable = false)
    private String descricaoProposta;

    @Column(name = "valor_proposta", nullable = true)
    private Double valorProposta;

    @ManyToOne
    @JoinColumn(name = "projeto_id", nullable = false)
    private Projeto projeto;

    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "status_proposta", nullable = false)
    private String statusProposta = "PENDENTE";

}
