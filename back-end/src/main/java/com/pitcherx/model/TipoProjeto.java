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
@Table(name = "tipo_projeto")
public class TipoProjeto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_tipo_projeto")
    private Long idTipoProjeto;

    @Column(name = "nome_tipo_projeto", nullable = false)
    private String nomeTipoProjeto;

    @Column(name = "descricao_tipo_projeto", nullable = false)
    private String descricaoTipoProjeto;
}
