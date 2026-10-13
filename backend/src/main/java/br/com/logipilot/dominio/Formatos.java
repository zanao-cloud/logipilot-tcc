package br.com.logipilot.dominio;

import java.util.regex.Pattern;

/**
 * Formatos brasileiros usados no cadastro. As mesmas regras valem no banco
 * (constraints da migração V5) e na tela, para o cadastro não aceitar placa
 * nem telefone inventado.
 */
public final class Formatos {

    /** AAA1234 (antigo) ou AAA1A23 (Mercosul). */
    private static final Pattern PLACA = Pattern.compile("^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$");

    /** DDD + 8 dígitos (fixo) ou DDD + 9 dígitos começando com 9 (celular). */
    private static final Pattern TELEFONE = Pattern.compile("^[1-9][1-9](9[0-9]{8}|[2-8][0-9]{7})$");

    private Formatos() {
    }

    /** Deixa só letras e números, em maiúsculas: "abc-1d23" vira "ABC1D23". */
    public static String normalizarPlaca(String placa) {
        if (placa == null || placa.isBlank()) {
            return null;
        }
        return placa.replaceAll("[^A-Za-z0-9]", "").toUpperCase();
    }

    /** Deixa só os dígitos: "(11) 93936-9341" vira "11939369341". */
    public static String normalizarTelefone(String telefone) {
        if (telefone == null || telefone.isBlank()) {
            return null;
        }
        String digitos = telefone.replaceAll("[^0-9]", "");
        return digitos.isEmpty() ? null : digitos;
    }

    public static boolean placaValida(String placaNormalizada) {
        return placaNormalizada != null && PLACA.matcher(placaNormalizada).matches();
    }

    public static boolean telefoneValido(String telefoneNormalizado) {
        return telefoneNormalizado != null && TELEFONE.matcher(telefoneNormalizado).matches();
    }
}
