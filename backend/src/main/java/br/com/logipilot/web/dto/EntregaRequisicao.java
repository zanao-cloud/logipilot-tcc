package br.com.logipilot.web.dto;

import br.com.logipilot.dominio.Prioridade;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

/** Entrega designada pelo operador. */
public record EntregaRequisicao(
        @NotNull(message = "Informe o motorista.")
        Long motoristaId,

        @NotNull(message = "Selecione um pacote do estoque.")
        Long pacoteId,

        @NotNull(message = "Informe o endereço.")
        String endereco,

        @NotNull(message = "Informe a cidade.")
        String cidade,

        @NotNull(message = "Informe o início da janela.")
        @JsonFormat(pattern = "HH:mm") LocalTime janelaInicio,

        @NotNull(message = "Informe o fim da janela.")
        @JsonFormat(pattern = "HH:mm") LocalTime janelaFim,

        @PositiveOrZero(message = "A distância não pode ser negativa.")
        BigDecimal distanciaKm,

        Prioridade prioridade,
        String observacoesOperador,

        @NotNull(message = "Informe a data da rota.")
        LocalDate data,

        Integer ordem) {
}
