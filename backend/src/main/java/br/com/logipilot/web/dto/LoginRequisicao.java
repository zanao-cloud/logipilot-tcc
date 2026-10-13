package br.com.logipilot.web.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequisicao(
        @NotBlank(message = "Informe o e-mail.")
        String email,

        @NotBlank(message = "Informe a senha.")
        String senha) {
}
