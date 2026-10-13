package br.com.logipilot.web;

import br.com.logipilot.dominio.Papel;
import br.com.logipilot.servico.UsuarioServico;
import br.com.logipilot.web.dto.UsuarioRequisicao;
import br.com.logipilot.web.dto.UsuarioResposta;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    private final UsuarioServico usuarios;

    public UsuarioController(UsuarioServico usuarios) {
        this.usuarios = usuarios;
    }

    /** Os filtros ?email= e ?papel= mantêm as buscas que o front-end já fazia. */
    @GetMapping
    public List<UsuarioResposta> listar(@RequestParam(required = false) String email,
                                        @RequestParam(required = false) Papel papel) {
        return usuarios.listar(email, papel).stream().map(UsuarioResposta::de).toList();
    }

    @GetMapping("/{id}")
    public UsuarioResposta buscar(@PathVariable Long id) {
        return UsuarioResposta.de(usuarios.buscar(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioResposta criar(@RequestBody @Valid UsuarioRequisicao requisicao) {
        return UsuarioResposta.de(usuarios.criar(requisicao));
    }

    @PutMapping("/{id}")
    public UsuarioResposta atualizar(@PathVariable Long id,
                                     @RequestBody @Valid UsuarioRequisicao requisicao) {
        return UsuarioResposta.de(usuarios.atualizar(id, requisicao));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        usuarios.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
