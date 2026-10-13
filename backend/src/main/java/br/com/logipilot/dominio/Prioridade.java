package br.com.logipilot.dominio;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum Prioridade {

    NORMAL, ALTA;

    @JsonValue
    public String paraJson() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static Prioridade deJson(String valor) {
        if (valor == null || valor.isBlank()) {
            return NORMAL;
        }
        return Prioridade.valueOf(valor.trim().toUpperCase());
    }
}
