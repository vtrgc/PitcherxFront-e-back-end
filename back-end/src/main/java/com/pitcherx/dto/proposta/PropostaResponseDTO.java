package com.pitcherx.dto.proposta;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

public record PropostaResponseDTO(
		Long idProposta,
		String descricaoProposta,
		Double valorProposta,
		String statusProposta,
		Long projetoId,
		Long usuarioId,
		String usuarioNome
		) {

}
