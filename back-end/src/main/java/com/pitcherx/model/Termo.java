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
@Table(name = "termo")
public class Termo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_termo")
    private Long idTermo;

    @Column(name = "titulo_termo", nullable = false)
    private String tituloTermo;

    @Column(name = "descricao_termo", nullable = false)
    private String descricaoTermo;

    @ManyToOne
    @JoinColumn(name = "id_contrato", nullable = true)
    private Contrato contrato;

}
