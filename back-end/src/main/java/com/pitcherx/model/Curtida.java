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
@Table(name = "curtida")
public class Curtida {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idCurtida;

    @Column(name = "curtida")
    private boolean curtida = true;

    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "tipo_conteudo_id", nullable = false)
    private TipoConteudo tipoConteudo;

    @Column(name = "conteudo_id", nullable = false)
    private Long conteudoId;

    @Column(name = "data_curtida")
    private LocalDateTime dataCurtida;

}
