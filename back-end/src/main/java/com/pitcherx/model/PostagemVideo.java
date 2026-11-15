package com.pitcherx.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "postagem_video", uniqueConstraints = @UniqueConstraint(
        name = "uk_postagem_video_ordem", columnNames = {"postagem_id", "ordem"}))
public class PostagemVideo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_postagem_video")
    private Long idPostagemVideo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "postagem_id", nullable = false)
    private Postagem postagem;

    @Column(name = "url_video", nullable = false, length = 2048)
    private String urlVideo;

    @Column(name = "ordem", nullable = false)
    private Integer ordem;
}