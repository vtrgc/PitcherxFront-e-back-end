package com.pitcherx.dto.endereco;


public record EnderecoResponseDTO(
		Long idEndereco,
		String cep,
		String uf,
		String bairro,
		String logradouro,
		String complemento,
		Integer numeroCasa,
		Long usuarioId
		) {

}
