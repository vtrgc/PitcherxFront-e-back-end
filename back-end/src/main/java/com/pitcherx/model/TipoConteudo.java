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
@Table(name = "tipo_conteudo")
public class TipoConteudo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_tipo_conteudo")
    private Long idTipoConteudo;

    @Enumerated(EnumType.STRING)
    @Column(name = "nome_tipo_conteudo")
    private TipoConteudoEnum nomeTipoConteudo;

    public TipoConteudo(TipoConteudoEnum nomeTipoConteudo){this.nomeTipoConteudo = nomeTipoConteudo;}

}
