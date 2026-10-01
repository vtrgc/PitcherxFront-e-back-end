package com.pitcherx.dto.perfilUsuario;

import com.pitcherx.dto.usuario.UsuarioSimples;
import com.pitcherx.model.Especialidade;

public record PerfilUsuarioResponseDTO(
		Long idPerfilUsuario,
		String linkedin,
		String identificador,
		String urlBanner,
		Especialidade especialidade,
		UsuarioSimples usuario
		) {

}
