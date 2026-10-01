package com.pitcherx.dto.postagem;

import java.time.LocalDate;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;

public record PostagemResponseDTO(
		Long idPostagem,
		String tituloPostagem,
		String textoPostagem,
		@JsonFormat(pattern = "dd/MM/yyyy")
		LocalDate dataPostagem,
		String urlImagemPostagem,
		List<String> imagens,
		Long usuarioId
		) {

}
