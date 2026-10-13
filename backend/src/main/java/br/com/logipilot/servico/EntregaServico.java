package br.com.logipilot.servico;

import br.com.logipilot.dominio.Entrega;
import br.com.logipilot.dominio.Papel;
import br.com.logipilot.dominio.Prioridade;
import br.com.logipilot.dominio.StatusEntrega;
import br.com.logipilot.dominio.Usuario;
import br.com.logipilot.repositorio.EntregaRepository;
import br.com.logipilot.web.dto.EntregaAtualizacao;
import br.com.logipilot.web.dto.EntregaRequisicao;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EntregaServico {

    private final EntregaRepository entregas;
    private final UsuarioServico usuarios;
    private final ClienteServico clientes;

    public EntregaServico(EntregaRepository entregas,
                          UsuarioServico usuarios,
                          ClienteServico clientes) {
        this.entregas = entregas;
        this.usuarios = usuarios;
        this.clientes = clientes;
    }

    @Transactional(readOnly = true)
    public List<Entrega> listar(Long motoristaId, LocalDate data) {
        if (motoristaId != null && data != null) {
            return entregas.findAllByMotoristaIdAndDataOrderByOrdemAsc(motoristaId, data);
        }
        if (motoristaId != null) {
            return entregas.findAllByMotoristaIdOrderByOrdemAsc(motoristaId);
        }
        if (data != null) {
            return entregas.findAllByDataOrderByOrdemAsc(data);
        }
        return entregas.findAll().stream()
                .sorted(Comparator.comparing(Entrega::getData)
                        .thenComparing(Entrega::getOrdem))
                .toList();
    }

    @Transactional(readOnly = true)
    public Entrega buscar(Long id) {
        return entregas.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Entrega", id));
    }

    @Transactional
    public Entrega designar(EntregaRequisicao requisicao) {
        Usuario motorista = usuarios.buscar(requisicao.motoristaId());

        if (motorista.getPapel() != Papel.MOTORISTA) {
            throw new RegraDeNegocioException("Entregas só podem ser designadas a motoristas.");
        }
        if (!requisicao.janelaFim().isAfter(requisicao.janelaInicio())) {
            throw new RegraDeNegocioException(
                    "O fim da janela de entrega precisa ser depois do início.");
        }

        // Dois pacotes com o mesmo código na rota do dia deixariam o motorista
        // sem saber qual caixa é de qual parada.
        String codigo = requisicao.codigo().trim().toUpperCase();
        if (entregas.existsByCodigoIgnoreCaseAndMotoristaIdAndData(
                codigo, motorista.getId(), requisicao.data())) {
            throw new RegraDeNegocioException(
                    "Já existe um pacote com a identificação %s na rota deste motorista nesta data."
                            .formatted(codigo));
        }

        Entrega entrega = new Entrega();
        entrega.setMotorista(motorista);
        entrega.setCliente(clientes.buscar(requisicao.clienteId()));
        entrega.setCodigo(codigo);
        entrega.setVolumes(requisicao.volumes() == null ? 1 : requisicao.volumes());
        entrega.setEndereco(requisicao.endereco().trim());
        entrega.setCidade(requisicao.cidade().trim());
        entrega.setJanelaInicio(requisicao.janelaInicio());
        entrega.setJanelaFim(requisicao.janelaFim());
        entrega.setDistanciaKm(requisicao.distanciaKm() == null
                ? BigDecimal.ZERO
                : requisicao.distanciaKm());
        entrega.setPrioridade(requisicao.prioridade() == null
                ? Prioridade.NORMAL
                : requisicao.prioridade());
        entrega.setObservacoesOperador(textoOuNulo(requisicao.observacoesOperador()));
        entrega.setData(requisicao.data());
        entrega.setOrdem(requisicao.ordem() != null
                ? requisicao.ordem()
                : proximaOrdem(motorista.getId(), requisicao.data()));
        entrega.setStatus(StatusEntrega.PENDENTE);
        entrega.setCriadoEm(Instant.now());

        return entregas.save(entrega);
    }

    /**
     * Atualização parcial: o motorista manda o desfecho e as observações, e a
     * otimização de rota manda só a nova posição na sequência.
     */
    @Transactional
    public Entrega atualizarParcialmente(Long id, EntregaAtualizacao atualizacao) {
        Entrega entrega = buscar(id);

        if (atualizacao.status() != null) {
            if (atualizacao.status() == StatusEntrega.AUSENTE
                    && (atualizacao.observacoes() == null || atualizacao.observacoes().isBlank())) {
                throw new RegraDeNegocioException(
                        "Descreva o que aconteceu no local antes de registrar a ausência.");
            }

            entrega.setStatus(atualizacao.status());

            // Voltar para pendente desfaz o registro: o horário e a observação saem junto.
            if (atualizacao.status() == StatusEntrega.PENDENTE) {
                entrega.setConcluidaEm(null);
                entrega.setObservacoes(null);
            } else {
                entrega.setConcluidaEm(atualizacao.concluidaEm() == null
                        ? Instant.now()
                        : atualizacao.concluidaEm());
                entrega.setObservacoes(textoOuNulo(atualizacao.observacoes()));
            }
        } else if (atualizacao.observacoes() != null) {
            entrega.setObservacoes(textoOuNulo(atualizacao.observacoes()));
        }

        if (atualizacao.ordem() != null) {
            entrega.setOrdem(atualizacao.ordem());
        }

        return entregas.save(entrega);
    }

    @Transactional
    public void excluir(Long id) {
        entregas.delete(buscar(id));
    }

    private int proximaOrdem(Long motoristaId, LocalDate data) {
        return entregas.findAllByMotoristaIdAndDataOrderByOrdemAsc(motoristaId, data).stream()
                .mapToInt(Entrega::getOrdem)
                .max()
                .orElse(0) + 1;
    }

    private String textoOuNulo(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }
}
