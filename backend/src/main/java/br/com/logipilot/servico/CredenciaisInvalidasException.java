package br.com.logipilot.servico;

/** Vira 401. A mensagem é propositalmente genérica. */
public class CredenciaisInvalidasException extends RuntimeException {

    public CredenciaisInvalidasException() {
        super("E-mail ou senha inválidos.");
    }
}
