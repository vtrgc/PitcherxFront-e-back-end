package com.pitcherx.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "risco_projeto")
public class RiscoProjeto {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_risco_projeto")
	private Long idRiscoProjeto;

	@Column(name = "nome_risco", nullable = false, unique = true)
	private String nomeRisco;

	@Column(name = "descricao_risco", columnDefinition = "TEXT")
	private String descricaoRisco;

	@ManyToMany(mappedBy = "riscos")
	private Set<Projeto> projetos = new HashSet<>();
}
