package br.com.logipilot.web.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/** Entrada de um volume no galpão. */
public record PacoteRequisicao(
        @NotBlank(message = "Informe a identificação do pacote.")
        @Size(max = 40, message = "A identificação do pacote é longa demais.")
        String codigo,

        @NotNull(message = "Selecione o cliente destinatário.")
        Long clienteId,

        @Min(value = 1, message = "O pacote precisa ter pelo menos um volume.")
        Integer volumes,

        String descricao,
        BigDecimal pesoKg,
        String observacoes) {
}
