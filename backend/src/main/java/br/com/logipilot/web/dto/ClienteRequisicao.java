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

        @NotBlank(message = "Informe o CEP.")
        String cep,

        @NotBlank(message = "Informe o logradouro.")
        String logradouro,

        @NotBlank(message = "Informe o número.")
        String numero,

        String complemento,

        @NotBlank(message = "Informe o bairro.")
        String bairro,

        @NotBlank(message = "Informe a cidade.")
        String cidade,

        @NotBlank(message = "Informe a UF.")
        String uf,

        LocalDate criadoEm) {
}
