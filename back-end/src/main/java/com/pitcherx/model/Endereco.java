package com.pitcherx.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
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
@Table(name = "endereco")
public class Endereco {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_endereco")
	private Long idEndereco;
	
	@Column(name = "cep", nullable = false, length = 8)
	private String cep;
	
	@Column(name = "uf", nullable = false, length = 2)
	private String uf;
	
	@Column(name = "bairro", nullable = false)
	private String bairro;
	
	@Column(name = "logradouro", nullable = false)
	private String logradouro;
	
	@Column(name = "complemento")
	private String complemento;
	
	@Column(name = "numero_casa", nullable = false)
	private Integer numeroCasa;
	
	@ManyToOne
	@JoinColumn(name = "usuario_id", nullable = false)
	private Usuario usuario;
	
}
