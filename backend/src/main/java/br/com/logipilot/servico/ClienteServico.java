package br.com.logipilot.servico;

import br.com.logipilot.dominio.Cliente;
import br.com.logipilot.dominio.Formatos;
import br.com.logipilot.repositorio.ClienteRepository;
import br.com.logipilot.repositorio.EntregaRepository;
import br.com.logipilot.repositorio.ProjetoRepository;
import br.com.logipilot.web.dto.ClienteRequisicao;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClienteServico {

    private final ClienteRepository clientes;
    private final ProjetoRepository projetos;
    private final EntregaRepository entregas;

    public ClienteServico(ClienteRepository clientes,
                          ProjetoRepository projetos,
                          EntregaRepository entregas) {
        this.clientes = clientes;
        this.projetos = projetos;
        this.entregas = entregas;
    }

    @Transactional(readOnly = true)
    public List<Cliente> listar() {
        return clientes.findAll();
    }

    @Transactional(readOnly = true)
    public Cliente buscar(Long id) {
        return clientes.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Cliente", id));
    }

    @Transactional
    public Cliente criar(ClienteRequisicao requisicao) {
        clientes.findByNomeIgnoreCase(requisicao.nome().trim()).ifPresent(existente -> {
            throw new RegraDeNegocioException("Já existe um cliente cadastrado com este nome.");
        });

        Cliente cliente = new Cliente();
        cliente.setCriadoEm(requisicao.criadoEm() == null ? LocalDate.now() : requisicao.criadoEm());
        aplicar(cliente, requisicao);

        return clientes.save(cliente);
    }

    @Transactional
    public Cliente atualizar(Long id, ClienteRequisicao requisicao) {
        Cliente cliente = buscar(id);

        clientes.findByNomeIgnoreCase(requisicao.nome().trim())
                .filter(outro -> !outro.getId().equals(id))
                .ifPresent(outro -> {
                    throw new RegraDeNegocioException("Já existe outro cliente com este nome.");
                });

        aplicar(cliente, requisicao);
        return clientes.save(cliente);
    }

    @Transactional
    public void excluir(Long id) {
        Cliente cliente = buscar(id);

        // O projeto e a entrega apontam para o cliente; apagar deixaria os dois órfãos.
        if (projetos.existsByClienteId(id)) {
            throw new RegraDeNegocioException(
                    "Este cliente tem projetos ligados e não pode ser excluído.");
        }
        if (entregas.existsByClienteId(id)) {
            throw new RegraDeNegocioException(
                    "Este cliente tem entregas registradas e não pode ser excluído.");
        }

        clientes.delete(cliente);
    }

    private void aplicar(Cliente cliente, ClienteRequisicao requisicao) {
        cliente.setNome(requisicao.nome().trim());
        cliente.setDocumento(textoOuNulo(requisicao.documento()));
        cliente.setResponsavel(textoOuNulo(requisicao.responsavel()));
        cliente.setTelefone(telefoneValidado(requisicao.telefone()));
        cliente.setEmail(requisicao.email() == null || requisicao.email().isBlank()
                ? null
                : requisicao.email().trim().toLowerCase());
        cliente.setEndereco(requisicao.endereco().trim());
        cliente.setCidade(requisicao.cidade().trim());
    }

    private String telefoneValidado(String telefone) {
        String normalizado = Formatos.normalizarTelefone(telefone);

        if (normalizado == null) {
            return null;
        }
        if (!Formatos.telefoneValido(normalizado)) {
            throw new RegraDeNegocioException(
                    "Telefone inválido. Use DDD + número, como (11) 93936-9341 ou (11) 3322-4455.");
        }

        return normalizado;
    }

    private String textoOuNulo(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }
}
