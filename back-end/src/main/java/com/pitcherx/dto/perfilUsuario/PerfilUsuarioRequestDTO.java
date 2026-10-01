package com.pitcherx.dto.perfilUsuario;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PerfilUsuarioRequestDTO(
		@NotBlank(message = "O linkedin do perfil é obrigatório!") String linkedin,
		@NotBlank(message = "O identificador (CPF/CNPJ) do perfil é obrigatório!") String identificador,
		@NotNull(message = "É obrigatório informar a especialidade do perfil!") Long idEspecialidade,
		@NotNull(message = "É obrigatório informar o usuário do perfil!") Long idUsuario
		) {

}
