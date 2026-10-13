package br.com.logipilot.web.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Nova tentativa de uma entrega que deu "ninguém no local". Só a data é
 * obrigatória; o resto, em branco, é copiado da entrega original.
 */
public record ReagendamentoRequisicao(
        @NotNull(message = "Informe a nova data da entrega.")
        LocalDate data,

        Long motoristaId,
        LocalTime janelaInicio,
        LocalTime janelaFim,
        String observacoesOperador) {
}
