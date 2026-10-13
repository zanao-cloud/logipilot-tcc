package br.com.logipilot.web.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record AnaliseRequisicao(
        @NotBlank(message = "Informe o título da análise.")
        String titulo,

        /* Opcional: a análise pode ser feita sem vínculo com um projeto. */
        Long projetoId,

        @NotNull(message = "Informe quem gerou a análise.")
        Long criadoPorId,

        String status,
        LocalDate criadoEm,
        JsonNode serieTemporal,
        JsonNode fontes,
        JsonNode resultado) {
}
