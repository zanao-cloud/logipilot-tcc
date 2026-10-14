package br.com.logipilot.web;

import br.com.logipilot.dominio.StatusPacote;
import br.com.logipilot.servico.PacoteServico;
import br.com.logipilot.web.dto.PacoteRequisicao;
import br.com.logipilot.web.dto.PacoteResposta;
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
@RequestMapping("/pacotes")
public class PacoteController {

    private final PacoteServico pacotes;

    public PacoteController(PacoteServico pacotes) {
        this.pacotes = pacotes;
    }

    /** ?status=em_estoque é o filtro que a tela de designação usa. */
    @GetMapping
    public List<PacoteResposta> listar(@RequestParam(required = false) StatusPacote status) {
        return pacotes.listar(status).stream().map(PacoteResposta::de).toList();
    }

    @GetMapping("/{id}")
    public PacoteResposta buscar(@PathVariable Long id) {
        return PacoteResposta.de(pacotes.buscar(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PacoteResposta receber(@RequestBody @Valid PacoteRequisicao requisicao) {
        return PacoteResposta.de(pacotes.receber(requisicao));
    }

    @PutMapping("/{id}")
    public PacoteResposta atualizar(@PathVariable Long id,
                                    @RequestBody @Valid PacoteRequisicao requisicao) {
        return PacoteResposta.de(pacotes.atualizar(id, requisicao));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        pacotes.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
