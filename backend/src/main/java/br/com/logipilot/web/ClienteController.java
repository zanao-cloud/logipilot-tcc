package br.com.logipilot.web;

import br.com.logipilot.servico.ClienteServico;
import br.com.logipilot.web.dto.ClienteRequisicao;
import br.com.logipilot.web.dto.ClienteResposta;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/clientes")
public class ClienteController {

    private final ClienteServico clientes;

    public ClienteController(ClienteServico clientes) {
        this.clientes = clientes;
    }

    @GetMapping
    public List<ClienteResposta> listar() {
        return clientes.listar().stream().map(ClienteResposta::de).toList();
    }

    @GetMapping("/{id}")
    public ClienteResposta buscar(@PathVariable Long id) {
        return ClienteResposta.de(clientes.buscar(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ClienteResposta criar(@RequestBody @Valid ClienteRequisicao requisicao) {
        return ClienteResposta.de(clientes.criar(requisicao));
    }

    @PutMapping("/{id}")
    public ClienteResposta atualizar(@PathVariable Long id,
                                     @RequestBody @Valid ClienteRequisicao requisicao) {
        return ClienteResposta.de(clientes.atualizar(id, requisicao));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        clientes.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
