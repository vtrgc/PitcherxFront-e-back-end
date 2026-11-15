package com.pitcherx.dto.perfilUsuario;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PerfilUsuarioRequestDTO(
		@NotBlank(message = "O linkedin do perfil é obrigatório!") String linkedin,
		@NotBlank(message = "O identificador (CPF/CNPJ) do perfil é obrigatório!") String identificador,
		@NotNull(message = "É obrigatório informar a especialidade do perfil!") Long idEspecialidade,
		@NotNull(message = "É obrigatório informar o usuário do perfil!") Long idUsuario,
		String urlBanner,
		String urlVideoPerfil,
		@Size(max = 1000, message = "A biografia pode ter no máximo 1000 caracteres.") String biografia
		) {

}
