package com.pitcherx.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "denuncia",
       indexes = {
           @Index(name = "idx_denuncia_status", columnList = "status"),
           @Index(name = "idx_denuncia_tipo_alvo", columnList = "tipo_denuncia, alvo_id"),
           @Index(name = "idx_denuncia_denunciante", columnList = "denunciante_id"),
           @Index(name = "idx_denuncia_prioridade", columnList = "prioridade"),
           @Index(name = "idx_denuncia_categoria", columnList = "categoria")
       })
public class Denuncia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_denuncia")
    private Long idDenuncia;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_denuncia", nullable = false, length = 30)
    private TipoDenuncia tipoDenuncia;

    @Column(name = "alvo_id", nullable = false)
    private Long alvoId;

    @Column(name = "categoria", nullable = false, length = 50)
    private String categoria;

    @Column(name = "descricao", length = 1000)
    private String descricao;

    @Column(name = "denunciante_id", nullable = false)
    private Long denuncianteId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private StatusDenuncia status = StatusDenuncia.PENDENTE;

    @Enumerated(EnumType.STRING)
    @Column(name = "prioridade", length = 20)
    private PrioridadeDenuncia prioridade;

    @Column(name = "data_criacao", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime dataCriacao;

    @Column(name = "data_atualizacao")
    @UpdateTimestamp
    private LocalDateTime dataAtualizacao;

    @Column(name = "data_decisao")
    private LocalDateTime dataDecisao;

    @Column(name = "decisao_admin", length = 1000)
    private String decisaoAdmin;

    @Column(name = "admin_id")
    private Long adminId;

    @Column(name = "acao_tomada", length = 100)
    private String acaoTomada;

    @Column(name = "apelacao_solicitada", nullable = false)
    private Boolean apelacaoSolicitada = Boolean.FALSE;

    @Column(name = "apelacao_justificativa", length = 1000)
    private String apelacaoJustificativa;

    @Column(name = "apelacao_decisao", length = 100)
    private String apelacaoDecisao;

    @Column(name = "apelacao_data")
    private LocalDateTime apelacaoData;

    public enum TipoDenuncia {
        PERFIL, POSTAGEM, PROJETO, COMENTARIO
    }

    public enum StatusDenuncia {
        PENDENTE, ACEITA, REJEITADA
    }

    public enum PrioridadeDenuncia {
        BAIXA, MEDIA, ALTA, CRITICA
    }
}
