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
@Table(name = "termo_vinculo")
public class TermoVinculo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_termo_vinculo")
    private Long idTermoVinculo;

    @Column(name = "titulo_termo_vinculo", nullable = false)
    private String tituloTermoVinculo;

    @Column(name = "descricao_termo_vinculo", nullable = false)
    private String descricaoTermoVinculo;
}
