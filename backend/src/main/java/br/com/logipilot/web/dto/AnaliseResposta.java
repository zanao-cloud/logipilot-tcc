package br.com.logipilot.web.dto;

import br.com.logipilot.dominio.Analise;
import com.fasterxml.jackson.databind.JsonNode;
import java.time.LocalDate;

public record AnaliseResposta(
        Long id,
        String titulo,
        Long projetoId,
        Long criadoPorId,
        String status,
        LocalDate criadoEm,
        JsonNode serieTemporal,
        JsonNode fontes,
        JsonNode resultado) {

    public static AnaliseResposta de(Analise analise) {
        return new AnaliseResposta(
                analise.getId(),
                analise.getTitulo(),
                analise.getProjeto() == null ? null : analise.getProjeto().getId(),
                analise.getCriadoPor().getId(),
                analise.getStatus(),
                analise.getCriadoEm(),
                analise.getSerieTemporal(),
                analise.getFontes(),
                analise.getResultado());
    }
}
