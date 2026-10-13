package br.com.logipilot.web;

import br.com.logipilot.servico.CredenciaisInvalidasException;
import br.com.logipilot.servico.RecursoNaoEncontradoException;
import br.com.logipilot.servico.RegraDeNegocioException;
import br.com.logipilot.web.dto.ErroResposta;
import java.util.List;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Centraliza as respostas de erro no formato {"erro": "..."} — é o campo que o
 * front-end já lia do servidor de IA.
 */
@RestControllerAdvice
public class TratadorDeErros {

    @ExceptionHandler(RecursoNaoEncontradoException.class)
    public ResponseEntity<ErroResposta> naoEncontrado(RecursoNaoEncontradoException excecao) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ErroResposta.de(excecao.getMessage()));
    }

    @ExceptionHandler(RegraDeNegocioException.class)
    public ResponseEntity<ErroResposta> regraDeNegocio(RegraDeNegocioException excecao) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ErroResposta.de(excecao.getMessage()));
    }

    @ExceptionHandler(CredenciaisInvalidasException.class)
    public ResponseEntity<ErroResposta> credenciais(CredenciaisInvalidasException excecao) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ErroResposta.de(excecao.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErroResposta> validacao(MethodArgumentNotValidException excecao) {
        List<String> detalhes = excecao.getBindingResult().getFieldErrors().stream()
                .map(erro -> erro.getDefaultMessage())
                .toList();

        String mensagem = detalhes.isEmpty() ? "Dados inválidos." : detalhes.get(0);
        return ResponseEntity.badRequest().body(new ErroResposta(mensagem, detalhes));
    }

    /**
     * Rede de segurança para as restrições do banco (índices únicos, chaves
     * estrangeiras): sem isto o usuário veria um 500 cru.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErroResposta> integridade(DataIntegrityViolationException excecao) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ErroResposta.de(
                "A operação conflita com dados já gravados. Atualize a página e tente de novo."));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErroResposta> corpoInvalido(HttpMessageNotReadableException excecao) {
        return ResponseEntity.badRequest()
                .body(ErroResposta.de("Não foi possível ler os dados enviados."));
    }
}
