package br.com.logipilot.dominio;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Perfis de acesso. No banco fica em maiúsculas; no JSON trafega em minúsculas,
 * que é como o front-end sempre tratou o campo ("gestor", "operador", "motorista").
 */
public enum Papel {

    GESTOR, OPERADOR, MOTORISTA;

    @JsonValue
    public String paraJson() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static Papel deJson(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return Papel.valueOf(valor.trim().toUpperCase());
    }
}
