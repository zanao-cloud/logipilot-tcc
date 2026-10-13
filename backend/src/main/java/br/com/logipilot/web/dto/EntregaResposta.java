package br.com.logipilot.web.dto;

import br.com.logipilot.dominio.Entrega;
import br.com.logipilot.dominio.Prioridade;
import br.com.logipilot.dominio.StatusEntrega;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

public record EntregaResposta(
        Long id,
        Long motoristaId,
        Long clienteId,
        String cliente,
        String codigo,
        Integer volumes,
        String endereco,
        String cidade,

        /* "08:00" — o mesmo formato que o input de horário do navegador envia. */
        @JsonFormat(pattern = "HH:mm") LocalTime janelaInicio,
        @JsonFormat(pattern = "HH:mm") LocalTime janelaFim,

        BigDecimal distanciaKm,
        Prioridade prioridade,
        String observacoesOperador,
        LocalDate data,
        Integer ordem,
        StatusEntrega status,
        String observacoes,
        Instant concluidaEm,
        Instant criadoEm) {

    public static EntregaResposta de(Entrega entrega) {
        return new EntregaResposta(
                entrega.getId(),
                entrega.getMotorista().getId(),
                entrega.getCliente().getId(),
                entrega.getCliente().getNome(),
                entrega.getCodigo(),
                entrega.getVolumes(),
                entrega.getEndereco(),
                entrega.getCidade(),
                entrega.getJanelaInicio(),
                entrega.getJanelaFim(),
                entrega.getDistanciaKm(),
                entrega.getPrioridade(),
                entrega.getObservacoesOperador(),
                entrega.getData(),
                entrega.getOrdem(),
                entrega.getStatus(),
                entrega.getObservacoes(),
                entrega.getConcluidaEm(),
                entrega.getCriadoEm());
    }
}
