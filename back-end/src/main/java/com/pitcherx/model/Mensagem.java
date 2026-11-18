package com.pitcherx.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** Mensagem de uma conversa privada. A exclusão é lógica: o texto é apagado e fica o aviso. */
@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "mensagem",
        uniqueConstraints = @UniqueConstraint(name = "uk_mensagem_chave_cliente", columnNames = {"remetente_id", "chave_cliente"}))
public class Mensagem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_mensagem")
    private Long idMensagem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversa_id", nullable = false)
    private Conversa conversa;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "remetente_id", nullable = false)
    private Usuario remetente;

    // Sem @Lob: no PostgreSQL ele grava um OID e quebra a leitura (o mesmo problema da biografia).
    @Column(name = "conteudo", nullable = false, columnDefinition = "TEXT")
    private String conteudo;

    @Column(name = "data_envio", nullable = false, updatable = false)
    private Instant dataEnvio;

    @Column(name = "lida", nullable = false)
    private boolean lida = false;

    @Column(name = "data_leitura")
    private Instant dataLeitura;

    @Column(name = "data_edicao")
    private Instant dataEdicao;

    @Column(name = "excluida", nullable = false)
    private boolean excluida = false;

    /** Muda a cada criação, leitura, edição ou exclusão (base da atualização incremental). */
    @Column(name = "data_atualizacao", nullable = false)
    private Instant dataAtualizacao;

    /** Identificador do envio gerado pelo front; repetir a chave devolve a mesma mensagem. */
    @Column(name = "chave_cliente", length = 64)
    private String chaveCliente;
}
