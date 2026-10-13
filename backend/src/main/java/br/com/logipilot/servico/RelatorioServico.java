package br.com.logipilot.servico;

import br.com.logipilot.dominio.Entrega;
import br.com.logipilot.dominio.StatusEntrega;
import br.com.logipilot.web.dto.RelatorioEntregas;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RelatorioServico {

    private static final ZoneId FUSO = ZoneId.of("America/Sao_Paulo");

    private final EntregaServico entregas;

    public RelatorioServico(EntregaServico entregas) {
        this.entregas = entregas;
    }

    @Transactional(readOnly = true)
    public RelatorioEntregas gerar(LocalDate de, LocalDate ate) {
        LocalDate fim = ate == null ? LocalDate.now(FUSO) : ate;
        LocalDate inicio = de == null ? fim.minusDays(29) : de;

        List<Entrega> periodo = entregas.listarPorPeriodo(inicio, fim);

        return new RelatorioEntregas(
                inicio,
                fim,
                totais(periodo),
                porMotorista(periodo),
                porCliente(periodo),
                porDia(periodo));
    }

    /**
     * Pontual é a entrega registrada até o fim da janela combinada. A mesma
     * regra vale na tela do motorista, para os dois números nunca divergirem.
     */
    private boolean foiPontual(Entrega entrega) {
        if (entrega.getStatus() != StatusEntrega.ENTREGUE || entrega.getConcluidaEm() == null) {
            return false;
        }
        return !horaLocal(entrega.getConcluidaEm()).isAfter(entrega.getJanelaFim());
    }

    private java.time.LocalTime horaLocal(Instant instante) {
        return instante.atZone(FUSO).toLocalTime();
    }

    private boolean visitada(Entrega entrega) {
        return entrega.getStatus() == StatusEntrega.ENTREGUE
                || entrega.getStatus() == StatusEntrega.AUSENTE;
    }

    private BigDecimal kmDe(List<Entrega> lista) {
        return lista.stream()
                .filter(this::visitada)
                .map(Entrega::getDistanciaKm)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(1, RoundingMode.HALF_UP);
    }

    private Integer percentual(long parte, long total) {
        return total == 0 ? null : Math.round((parte * 100f) / total);
    }

    private long contar(List<Entrega> lista, StatusEntrega status) {
        return lista.stream().filter(e -> e.getStatus() == status).count();
    }

    private RelatorioEntregas.Totais totais(List<Entrega> periodo) {
        long entregues = contar(periodo, StatusEntrega.ENTREGUE);
        long noPrazo = periodo.stream().filter(this::foiPontual).count();

        return new RelatorioEntregas.Totais(
                periodo.size(),
                entregues,
                contar(periodo, StatusEntrega.AUSENTE),
                contar(periodo, StatusEntrega.PENDENTE),
                noPrazo,
                percentual(noPrazo, entregues),
                kmDe(periodo),
                periodo.stream().mapToLong(Entrega::getVolumes).sum());
    }

    private List<RelatorioEntregas.PorMotorista> porMotorista(List<Entrega> periodo) {
        Map<Long, List<Entrega>> agrupadas = periodo.stream()
                .collect(Collectors.groupingBy(e -> e.getMotorista().getId()));

        return agrupadas.values().stream()
                .map(lista -> {
                    var motorista = lista.get(0).getMotorista();
                    long entregues = contar(lista, StatusEntrega.ENTREGUE);
                    long noPrazo = lista.stream().filter(this::foiPontual).count();

                    return new RelatorioEntregas.PorMotorista(
                            motorista.getId(),
                            motorista.getNome(),
                            motorista.getPlaca(),
                            lista.size(),
                            entregues,
                            contar(lista, StatusEntrega.AUSENTE),
                            percentual(noPrazo, entregues),
                            kmDe(lista));
                })
                .sorted(Comparator.comparingLong(RelatorioEntregas.PorMotorista::entregas).reversed())
                .toList();
    }

    private List<RelatorioEntregas.PorCliente> porCliente(List<Entrega> periodo) {
        Map<Long, List<Entrega>> agrupadas = periodo.stream()
                .collect(Collectors.groupingBy(e -> e.getCliente().getId()));

        return agrupadas.values().stream()
                .map(lista -> {
                    var cliente = lista.get(0).getCliente();
                    long ausentes = contar(lista, StatusEntrega.AUSENTE);
                    long visitadas = lista.stream().filter(this::visitada).count();

                    return new RelatorioEntregas.PorCliente(
                            cliente.getId(),
                            cliente.getNome(),
                            lista.size(),
                            ausentes,
                            percentual(ausentes, visitadas));
                })
                // Quem mais falha na porta aparece primeiro: é onde o gestor age.
                .sorted(Comparator.comparingLong(RelatorioEntregas.PorCliente::ausentes).reversed())
                .toList();
    }

    private List<RelatorioEntregas.PorDia> porDia(List<Entrega> periodo) {
        Map<LocalDate, List<Entrega>> agrupadas = periodo.stream()
                .collect(Collectors.groupingBy(Entrega::getData));

        return agrupadas.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(dia -> new RelatorioEntregas.PorDia(
                        dia.getKey(),
                        dia.getValue().size(),
                        contar(dia.getValue(), StatusEntrega.ENTREGUE),
                        kmDe(dia.getValue())))
                .toList();
    }
}
