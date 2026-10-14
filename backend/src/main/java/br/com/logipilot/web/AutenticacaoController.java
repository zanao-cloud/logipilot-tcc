package br.com.logipilot.web;

import br.com.logipilot.servico.AutenticacaoServico;
import br.com.logipilot.web.dto.LoginRequisicao;
import br.com.logipilot.web.dto.RecuperacaoSenhaRequisicao;
import br.com.logipilot.web.dto.UsuarioResposta;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AutenticacaoController {

    private final AutenticacaoServico autenticacao;

    public AutenticacaoController(AutenticacaoServico autenticacao) {
        this.autenticacao = autenticacao;
    }

    /** Devolve o usuário autenticado, sem o hash da senha. */
    @PostMapping("/login")
    public UsuarioResposta entrar(@RequestBody @Valid LoginRequisicao requisicao) {
        return UsuarioResposta.de(autenticacao.autenticar(requisicao.email(), requisicao.senha()));
    }

    /** Redefine a senha conferindo o telefone do cadastro. */
    @PostMapping("/recuperar-senha")
    public ResponseEntity<Void> recuperarSenha(
            @RequestBody @Valid RecuperacaoSenhaRequisicao requisicao) {
        autenticacao.redefinirSenha(
                requisicao.email(), requisicao.telefone(), requisicao.novaSenha());
        return ResponseEntity.noContent().build();
    }
}
