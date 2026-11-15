package com.pitcherx.model;

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
@Table(name = "perfil_usuario")
public class PerfilUsuario {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_perfil_usuario")
	private Long idPerfilUsuario;
	
	@Column(name = "linkedin", nullable = false, length = 80)
	private String linkedin;
	
	@Column(name = "identificador", length = 18)
	private String identificador;
	
	@Column(name = "url_banner_perfil")
	private String urlBanner;

	@Column(name = "url_video_perfil")
	private String urlVideoPerfil;
	
	// Sem @Lob: no PostgreSQL, @Lob em String grava um "large object" (o texto virava um número
	// de OID na coluna TEXT) e a leitura falhava com "Unable to access lob stream".
	@Column(name = "biografia", columnDefinition = "TEXT")
	private String biografia;
	
	@ManyToOne
	@JoinColumn(name = "especialidade_id", nullable = false)
	private Especialidade especialidade;

	@OneToOne
	@JoinColumn(name = "usuario_id")
	private Usuario usuario;
	
}
