package br.com.logipilot.web;

import br.com.logipilot.servico.ProjetoServico;
import br.com.logipilot.web.dto.ProjetoRequisicao;
import br.com.logipilot.web.dto.ProjetoResposta;
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
@RequestMapping("/projetos")
public class ProjetoController {

    private final ProjetoServico projetos;

    public ProjetoController(ProjetoServico projetos) {
        this.projetos = projetos;
    }

    @GetMapping
    public List<ProjetoResposta> listar(@RequestParam(required = false) Long clienteId) {
        return projetos.listar(clienteId).stream().map(ProjetoResposta::de).toList();
    }

    @GetMapping("/{id}")
    public ProjetoResposta buscar(@PathVariable Long id) {
        return ProjetoResposta.de(projetos.buscar(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProjetoResposta criar(@RequestBody @Valid ProjetoRequisicao requisicao) {
        return ProjetoResposta.de(projetos.criar(requisicao));
    }

    @PutMapping("/{id}")
    public ProjetoResposta atualizar(@PathVariable Long id,
                                     @RequestBody @Valid ProjetoRequisicao requisicao) {
        return ProjetoResposta.de(projetos.atualizar(id, requisicao));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        projetos.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
