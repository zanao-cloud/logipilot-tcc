package br.com.logipilot.web;

import br.com.logipilot.servico.EntregaServico;
import br.com.logipilot.web.dto.EntregaAtualizacao;
import br.com.logipilot.web.dto.EntregaRequisicao;
import br.com.logipilot.web.dto.EntregaResposta;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/entregas")
public class EntregaController {

    private final EntregaServico entregas;

    public EntregaController(EntregaServico entregas) {
        this.entregas = entregas;
    }

    /** ?motoristaId= é o filtro que a página do motorista usa para montar a rota. */
    @GetMapping
    public List<EntregaResposta> listar(
            @RequestParam(required = false) Long motoristaId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        return entregas.listar(motoristaId, data).stream().map(EntregaResposta::de).toList();
    }

    @GetMapping("/{id}")
    public EntregaResposta buscar(@PathVariable Long id) {
        return EntregaResposta.de(entregas.buscar(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EntregaResposta designar(@RequestBody @Valid EntregaRequisicao requisicao) {
        return EntregaResposta.de(entregas.designar(requisicao));
    }

    /** Usado pelo motorista ao fechar a parada e pela otimização ao reordenar. */
    @PatchMapping("/{id}")
    public EntregaResposta atualizar(@PathVariable Long id,
                                     @RequestBody EntregaAtualizacao atualizacao) {
        return EntregaResposta.de(entregas.atualizarParcialmente(id, atualizacao));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        entregas.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
