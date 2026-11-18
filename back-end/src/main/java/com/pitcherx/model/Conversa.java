package com.pitcherx.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.Objects;

/**
 * Conversa privada entre dois usuários. O par fica sempre ordenado (usuarioA tem o menor id),
 * então existe no máximo uma conversa entre as mesmas duas pessoas.
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "conversa",
        uniqueConstraints = @UniqueConstraint(name = "uk_conversa_par", columnNames = {"usuario_a_id", "usuario_b_id"}))
public class Conversa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_conversa")
    private Long idConversa;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_a_id", nullable = false)
    private Usuario usuarioA;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_b_id", nullable = false)
    private Usuario usuarioB;

    @Column(name = "data_criacao", nullable = false, updatable = false)
    private Instant dataCriacao = Instant.now();

    @Column(name = "data_ultima_mensagem")
    private Instant dataUltimaMensagem;

    /** Cria a conversa já com o par na ordem certa. */
    public static Conversa entre(Usuario um, Usuario outro) {
        Conversa c = new Conversa();
        boolean umPrimeiro = um.getIdUsuario() < outro.getIdUsuario();
        c.setUsuarioA(umPrimeiro ? um : outro);
        c.setUsuarioB(umPrimeiro ? outro : um);
        return c;
    }

    public boolean temParticipante(Long idUsuario) {
        return Objects.equals(usuarioA.getIdUsuario(), idUsuario) || Objects.equals(usuarioB.getIdUsuario(), idUsuario);
    }

    /** A outra pessoa da conversa, do ponto de vista de {@code idUsuario}. */
    public Usuario outroParticipante(Long idUsuario) {
        return Objects.equals(usuarioA.getIdUsuario(), idUsuario) ? usuarioB : usuarioA;
    }
}
