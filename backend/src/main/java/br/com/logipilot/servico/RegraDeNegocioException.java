package br.com.logipilot.servico;

/** Vira 409 no TratadorDeErros: o pedido é válido, mas conflita com os dados. */
public class RegraDeNegocioException extends RuntimeException {

    public RegraDeNegocioException(String mensagem) {
        super(mensagem);
    }
}
