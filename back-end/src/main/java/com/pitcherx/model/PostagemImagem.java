package com.pitcherx.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "postagem_imagem", uniqueConstraints = @UniqueConstraint(
        name = "uk_postagem_imagem_ordem", columnNames = {"postagem_id", "ordem"}))
public class PostagemImagem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_postagem_imagem")
    private Long idPostagemImagem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "postagem_id", nullable = false)
    private Postagem postagem;

    @Column(name = "url_imagem", nullable = false, length = 2048)
    private String urlImagem;

    @Column(name = "ordem", nullable = false)
    private Integer ordem;
}
