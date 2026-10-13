package br.com.logipilot.web.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

public record ClienteRequisicao(
        @NotBlank(message = "Informe o nome do cliente.")
        String nome,

        String documento,
        String responsavel,
        String telefone,
        String email,

        @NotBlank(message = "Informe o endereço de entrega.")
        String endereco,

        @NotBlank(message = "Informe a cidade.")
        String cidade,

        LocalDate criadoEm) {
}
