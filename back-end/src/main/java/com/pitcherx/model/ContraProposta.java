package com.pitcherx.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "contra_proposta")
public class ContraProposta {

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
	
}
