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
@Table(name = "termo_postagem")
public class TermoPostagem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_termo_postagem")
    private Long idTermoPostagem;

    @Column(name = "titulo_termo_postagem", nullable = false)
    private String tituloTermoPostagem;

    @Column(name = "descricao_termo_postagem", nullable = false)
    private String descricaoTermoPostagem;
}
