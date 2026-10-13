package br.com.logipilot.web.dto;

import br.com.logipilot.dominio.StatusEntrega;
import java.time.Instant;

/**
 * Atualização parcial (PATCH). É o que o motorista envia ao fechar uma parada
 * e o que a otimização de rota envia ao reordenar a sequência: cada campo nulo
 * é simplesmente ignorado.
 */
public record EntregaAtualizacao(
        StatusEntrega status,
        String observacoes,
        String recebidoPor,
        Instant concluidaEm,
        Integer ordem,
        /* Conferência de carga: true marca o pacote como carregado, false desmarca. */
        Boolean conferida) {
}
