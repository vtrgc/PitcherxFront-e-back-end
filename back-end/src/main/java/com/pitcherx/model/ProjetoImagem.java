package com.pitcherx.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "projeto_imagem", uniqueConstraints = @UniqueConstraint(
        name = "uk_projeto_imagem_ordem", columnNames = {"projeto_id", "ordem"}))
public class ProjetoImagem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_projeto_imagem")
    private Long idProjetoImagem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "projeto_id", nullable = false)
    private Projeto projeto;

    @Column(name = "url_imagem", nullable = false, length = 2048)
    private String urlImagem;

    @Column(name = "ordem", nullable = false)
    private Integer ordem;
}
