package br.com.logipilot.web.dto;

import br.com.logipilot.dominio.Prioridade;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

/** Entrega designada pelo operador. */
public record EntregaRequisicao(
        @NotNull(message = "Informe o motorista.")
        Long motoristaId,

        @NotNull(message = "Selecione um cliente cadastrado.")
        Long clienteId,

        @NotBlank(message = "Informe a identificação do pacote.")
        @Size(max = 40, message = "A identificação do pacote é longa demais.")
        String codigo,

        @Min(value = 1, message = "A entrega precisa ter pelo menos um volume.")
        Integer volumes,

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
