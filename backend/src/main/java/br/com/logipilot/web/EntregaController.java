package br.com.logipilot.web;

import br.com.logipilot.servico.ComprovanteServico;
import br.com.logipilot.servico.EntregaServico;
import br.com.logipilot.web.dto.EntregaAtualizacao;
import br.com.logipilot.web.dto.EntregaRequisicao;
import br.com.logipilot.web.dto.EntregaResposta;
import br.com.logipilot.web.dto.ReagendamentoRequisicao;
import jakarta.validation.Valid;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.List;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;
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
    private final ComprovanteServico comprovantes;

    public EntregaController(EntregaServico entregas, ComprovanteServico comprovantes) {
        this.entregas = entregas;
        this.comprovantes = comprovantes;
    }

    /** ?motoristaId= é o filtro que a página do motorista usa para montar a rota. */
    @GetMapping
    public List<EntregaResposta> listar(
            @RequestParam(required = false) Long motoristaId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data) {
        return entregas.listar(motoristaId, data).stream().map(EntregaResposta::de).toList();
    }

    /** Paradas que deram "ninguém no local" e ainda não foram reagendadas. */
    @GetMapping("/reagendamento")
    public List<EntregaResposta> pendentesDeReagendamento() {
        return entregas.pendentesDeReagendamento().stream().map(EntregaResposta::de).toList();
    }

    @GetMapping("/{id}")
    public EntregaResposta buscar(@PathVariable Long id) {
        return EntregaResposta.de(entregas.buscar(id));
    }

    /** Cria uma nova tentativa para uma entrega não concluída. */
    @PostMapping("/{id}/reagendar")
    @ResponseStatus(HttpStatus.CREATED)
    public EntregaResposta reagendar(@PathVariable Long id,
                                     @RequestBody @Valid ReagendamentoRequisicao requisicao) {
        return EntregaResposta.de(entregas.reagendar(id, requisicao));
    }

    @PostMapping(path = "/{id}/comprovante", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public EntregaResposta enviarComprovante(@PathVariable Long id,
                                             @RequestPart("arquivo") MultipartFile arquivo) {
        entregas.buscar(id);
        String nome = comprovantes.guardar(id, arquivo);
        return EntregaResposta.de(entregas.registrarComprovante(id, nome));
    }

    @GetMapping("/{id}/comprovante")
    public ResponseEntity<Resource> baixarComprovante(@PathVariable Long id) throws IOException {
        var entrega = entregas.buscar(id);

        if (entrega.getComprovanteArquivo() == null) {
            return ResponseEntity.notFound().build();
        }

        Path caminho = comprovantes.caminhoDe(entrega.getComprovanteArquivo());

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                        comprovantes.tipoDe(entrega.getComprovanteArquivo())))
                .contentLength(Files.size(caminho))
                .body(new FileSystemResource(caminho));
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
