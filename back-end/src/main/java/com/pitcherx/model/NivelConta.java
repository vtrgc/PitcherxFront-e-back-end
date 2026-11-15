package com.pitcherx.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "nivel_conta")
public class NivelConta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_nivel_conta")
    private Long idNivelConta;

    @Enumerated(EnumType.STRING)
    @Column(name = "nome", nullable = false, unique = true, length = 30)
    private NivelContaNome nome;

    @Column(name = "descricao", length = 200)
    private String descricao;

    @Column(name = "ordem", nullable = false)
    private Integer ordem;

    @OneToMany(mappedBy = "nivelConta", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Usuario> usuarios = new ArrayList<>();

    public enum NivelContaNome {
        INICIANTE, EXPLORADOR, PROFISSIONAL, ESPECIALISTA, REFERENCIA, ELITE
    }
}
