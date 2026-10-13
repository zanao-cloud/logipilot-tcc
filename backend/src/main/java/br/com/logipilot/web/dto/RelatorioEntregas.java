package br.com.logipilot.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Números da operação calculados a partir das entregas registradas. É o que
 * alimenta o painel do gestor e também o que é enviado para a IA analisar.
 */
public record RelatorioEntregas(
        LocalDate de,
        LocalDate ate,
        Totais totais,
        List<PorMotorista> porMotorista,
        List<PorCliente> porCliente,
        List<PorDia> porDia) {

    public record Totais(
            long entregas,
            long entregues,
            long ausentes,
            long pendentes,
            long noPrazo,
            Integer pontualidade,
            BigDecimal kmRodados,
            long volumes) {
    }

    public record PorMotorista(
            Long motoristaId,
            String motorista,
            String placa,
            long entregas,
            long entregues,
            long ausentes,
            Integer pontualidade,
            BigDecimal kmRodados) {
    }

    public record PorCliente(
            Long clienteId,
            String cliente,
            long entregas,
            long ausentes,
            Integer taxaDeAusencia) {
    }

    public record PorDia(LocalDate data, long entregas, long entregues, BigDecimal kmRodados) {
    }
}
