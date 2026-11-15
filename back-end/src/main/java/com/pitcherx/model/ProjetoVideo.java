package com.pitcherx.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "projeto_video", uniqueConstraints = @UniqueConstraint(
        name = "uk_projeto_video_ordem", columnNames = {"projeto_id", "ordem"}))
public class ProjetoVideo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_projeto_video")
    private Long idProjetoVideo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "projeto_id", nullable = false)
    private Projeto projeto;

    @Column(name = "url_video", nullable = false, length = 2048)
    private String urlVideo;

    @Column(name = "ordem", nullable = false)
    private Integer ordem;
}