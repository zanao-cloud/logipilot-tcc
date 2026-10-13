package br.com.logipilot.web;

import br.com.logipilot.servico.AnaliseServico;
import br.com.logipilot.web.dto.AnaliseRequisicao;
import br.com.logipilot.web.dto.AnaliseResposta;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/analises")
public class AnaliseController {

    private final AnaliseServico analises;

    public AnaliseController(AnaliseServico analises) {
        this.analises = analises;
    }

    @GetMapping
    public List<AnaliseResposta> listar(@RequestParam(required = false) Long criadoPorId) {
        return analises.listar(criadoPorId).stream().map(AnaliseResposta::de).toList();
    }

    @GetMapping("/{id}")
    public AnaliseResposta buscar(@PathVariable Long id) {
        return AnaliseResposta.de(analises.buscar(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AnaliseResposta criar(@RequestBody @Valid AnaliseRequisicao requisicao) {
        return AnaliseResposta.de(analises.criar(requisicao));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        analises.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
