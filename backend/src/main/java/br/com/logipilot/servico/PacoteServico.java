package br.com.logipilot.servico;

import br.com.logipilot.dominio.Pacote;
import br.com.logipilot.dominio.StatusPacote;
import br.com.logipilot.repositorio.PacoteRepository;
import br.com.logipilot.web.dto.PacoteRequisicao;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PacoteServico {

    private final PacoteRepository pacotes;
    private final ClienteServico clientes;

    public PacoteServico(PacoteRepository pacotes, ClienteServico clientes) {
        this.pacotes = pacotes;
        this.clientes = clientes;
    }

    @Transactional(readOnly = true)
    public List<Pacote> listar(StatusPacote status) {
        return status == null
                ? pacotes.findAllByOrderByRecebidoEmDesc()
                : pacotes.findAllByStatusOrderByRecebidoEmAsc(status);
    }

    @Transactional(readOnly = true)
    public Pacote buscar(Long id) {
        return pacotes.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Pacote", id));
    }

    /** Entrada do volume no galpão. */
    @Transactional
    public Pacote receber(PacoteRequisicao requisicao) {
        String codigo = requisicao.codigo().trim().toUpperCase();

        if (pacotes.existsByCodigoIgnoreCase(codigo)) {
            throw new RegraDeNegocioException(
                    "Já existe um pacote com a identificação %s no sistema.".formatted(codigo));
        }

        Pacote pacote = new Pacote();
        pacote.setCodigo(codigo);
        pacote.setRecebidoEm(Instant.now());
        pacote.setStatus(StatusPacote.EM_ESTOQUE);
        aplicar(pacote, requisicao);

        return pacotes.save(pacote);
    }

    @Transactional
    public Pacote atualizar(Long id, PacoteRequisicao requisicao) {
        Pacote pacote = buscar(id);

        // Depois de designado o pacote já está na rota de alguém: mudar o
        // destinatário ou a quantidade aqui deixaria a entrega mentindo.
        if (pacote.getStatus() != StatusPacote.EM_ESTOQUE) {
            throw new RegraDeNegocioException(
                    "Só é possível editar um pacote que ainda está em estoque.");
        }

        String codigo = requisicao.codigo().trim().toUpperCase();
        pacotes.findByCodigoIgnoreCase(codigo)
                .filter(outro -> !outro.getId().equals(id))
                .ifPresent(outro -> {
                    throw new RegraDeNegocioException(
                            "Já existe outro pacote com a identificação %s.".formatted(codigo));
                });

        pacote.setCodigo(codigo);
        aplicar(pacote, requisicao);

        return pacotes.save(pacote);
    }

    @Transactional
    public void excluir(Long id) {
        Pacote pacote = buscar(id);

        if (pacote.getStatus() != StatusPacote.EM_ESTOQUE) {
            throw new RegraDeNegocioException(
                    "Este pacote já foi designado e não pode ser excluído do estoque.");
        }

        pacotes.delete(pacote);
    }

    /** Chamado pelo serviço de entregas quando o pacote muda de etapa. */
    @Transactional
    public void mudarStatus(Pacote pacote, StatusPacote status) {
        pacote.setStatus(status);
        pacotes.save(pacote);
    }

    private void aplicar(Pacote pacote, PacoteRequisicao requisicao) {
        pacote.setCliente(clientes.buscar(requisicao.clienteId()));
        pacote.setVolumes(requisicao.volumes() == null ? 1 : requisicao.volumes());
        pacote.setDescricao(textoOuNulo(requisicao.descricao()));
        pacote.setPesoKg(requisicao.pesoKg());
        pacote.setObservacoes(textoOuNulo(requisicao.observacoes()));
    }

    private String textoOuNulo(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }
}
