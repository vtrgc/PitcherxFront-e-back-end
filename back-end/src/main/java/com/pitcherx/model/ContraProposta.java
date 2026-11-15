package com.pitcherx.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "contra_proposta")
public class ContraProposta {

    public enum StatusContraProposta {
        PENDENTE, ACEITA, REJEITADA
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_contra_proposta")
    private Long idContraProposta;

    @Column(name = "descricao_contra_proposta", nullable = false)
    private String descricaoContraProposta;

    @Column(name = "valor_contra_proposta", nullable = true)
    private Double valorContraProposta;

    @ManyToOne
    @JoinColumn(name = "proposta_id", nullable = false)
    private Proposta proposta;

    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_contra_proposta", nullable = false)
    private StatusContraProposta status = StatusContraProposta.PENDENTE;

    @Column(name = "data_criacao", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime dataCriacao;

    @Column(name = "data_atualizacao")
    @UpdateTimestamp
    private LocalDateTime dataAtualizacao;

    @Column(name = "data_decisao")
    private LocalDateTime dataDecisao;

    /** Justificativa de quem decidiu (obrigatória ao rejeitar). Antes só ia na notificação. */
    @Column(name = "justificativa_decisao", columnDefinition = "TEXT")
    private String justificativaDecisao;

}
