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
@Table(name = "sub_area")
public class SubArea {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_sub_area")
    private Long idSubArea;

    @Column(name = "nome_sub_area", nullable = false)
    private String nomeSubArea;

    @Column(name = "descricao_sub_area", nullable = false)
    private String descricaoSubArea;

    @ManyToOne
    @JoinColumn(name = "id_area", nullable = false)
    private Area area;

}
