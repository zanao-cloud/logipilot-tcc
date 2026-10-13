package br.com.logipilot.web;

import br.com.logipilot.servico.RelatorioServico;
import br.com.logipilot.web.dto.RelatorioEntregas;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/relatorios")
public class RelatorioController {

    private final RelatorioServico relatorios;

    public RelatorioController(RelatorioServico relatorios) {
        this.relatorios = relatorios;
    }

    /** Sem datas, devolve os últimos 30 dias. */
    @GetMapping("/entregas")
    public RelatorioEntregas entregas(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate de,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate ate) {
        return relatorios.gerar(de, ate);
    }
}
