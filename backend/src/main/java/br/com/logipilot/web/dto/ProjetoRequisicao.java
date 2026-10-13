package br.com.logipilot.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record ProjetoRequisicao(
        @NotBlank(message = "Informe o nome do projeto.")
        String nome,

        @NotNull(message = "Selecione um cliente cadastrado.")
        Long clienteId,

        LocalDate criadoEm) {
}
