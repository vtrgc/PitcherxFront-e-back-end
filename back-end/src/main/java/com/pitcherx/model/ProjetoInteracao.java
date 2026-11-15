package com.pitcherx.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(
        name = "projeto_interacao",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_projeto_usuario_tipo",
                columnNames = {"projeto_id", "usuario_id", "tipo_interacao"}
        )
)
public class ProjetoInteracao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_projeto_interacao")
    private Long idProjetoInteracao;

    @ManyToOne
    @JoinColumn(name = "projeto_id", nullable = false)
    private Projeto projeto;

    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_interacao", nullable = false, length = 20)
    private TipoInteracao tipoInteracao;

    @Column(name = "data_interacao", nullable = false)
    private LocalDateTime dataInteracao;

    public enum TipoInteracao {
        VISUALIZACAO, SEGUIR
    }
}
