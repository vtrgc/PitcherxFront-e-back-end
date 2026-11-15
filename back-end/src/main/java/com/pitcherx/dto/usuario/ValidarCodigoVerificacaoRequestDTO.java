package com.pitcherx.dto.usuario;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ValidarCodigoVerificacaoRequestDTO {

    @NotBlank(message = "O código de verificação é obrigatório!")
    private String codigoVerificacao;
}