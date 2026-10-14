package br.com.logipilot.dominio;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Ciclo de vida do pacote no galpão: entra em estoque, é designado para um
 * motorista e sai quando a entrega é concluída.
 */
public enum StatusPacote {

    EM_ESTOQUE, DESIGNADO, ENTREGUE;

    @JsonValue
    public String paraJson() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static StatusPacote deJson(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return StatusPacote.valueOf(valor.trim().toUpperCase());
    }
}
