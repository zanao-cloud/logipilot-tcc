package br.com.logipilot.web.dto;

import java.util.List;

/** O front-end lê sempre o campo "erro"; "detalhes" traz as falhas de validação. */
public record ErroResposta(String erro, List<String> detalhes) {

    public static ErroResposta de(String mensagem) {
        return new ErroResposta(mensagem, List.of());
    }
}
