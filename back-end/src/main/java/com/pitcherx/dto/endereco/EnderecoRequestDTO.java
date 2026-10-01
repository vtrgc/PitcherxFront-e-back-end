package com.pitcherx.dto.endereco;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record EnderecoRequestDTO(
		@NotBlank(message = "O CEP é obrigatório!") 
		@Size(max = 8, message = "O CEP pode ter somente até 8 caracteres")
		String cep,
		@NotBlank(message = "O estado é obrigatório!")
		@Size(max = 2, message = "O UF pode ter somente até 2 caracteres")
		String uf,
		@NotBlank(message = "O bairro é obrigatório!") String bairro,
		@NotBlank(message = "O logradouro é obrigatório!") String logradouro,
		@NotBlank(message = "O complemento é obrigatório!") String complemento,
		@NotNull(message = "O número da casa é obrigatório!") Integer numeroCasa,
		@NotNull(message = "O ID do usuário é obrigatório!") Long usuarioId
		) {

}