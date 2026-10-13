package br.com.logipilot.dominio;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/** AUSENTE é o "não havia ninguém no local" registrado pelo motorista. */
public enum StatusEntrega {

    PENDENTE, ENTREGUE, AUSENTE;

    @JsonValue
    public String paraJson() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static StatusEntrega deJson(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return StatusEntrega.valueOf(valor.trim().toUpperCase());
    }
}
