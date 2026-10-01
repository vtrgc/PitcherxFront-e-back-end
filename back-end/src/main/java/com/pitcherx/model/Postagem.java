package com.pitcherx.model;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "postagem")
public class Postagem {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_postagem")
	private Long idPostagem;
	
	@Column(name = "titulo_postagem", nullable = false)
	private String tituloPostagem;
	
	@Column(name = "texto_postagem", nullable = false)
	private String textoPostagem;
	
	@Column(name = "data_postagem", nullable = false)
	private LocalDate dataPostagem;
	
	@Column(name = "url_imagem_postagem", nullable = true)
	private String urlImagemPostagem;
	
	@ManyToOne
	@JoinColumn(name = "usuario_id", nullable = false)
	private Usuario usuario;

	@OneToMany(mappedBy = "postagem", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("ordem ASC")
	private List<PostagemImagem> imagens = new ArrayList<>();
}
