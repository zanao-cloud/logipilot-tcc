package br.com.logipilot.servico;

import br.com.logipilot.dominio.Projeto;
import br.com.logipilot.repositorio.ProjetoRepository;
import br.com.logipilot.web.dto.ProjetoRequisicao;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProjetoServico {

    private final ProjetoRepository projetos;
    private final ClienteServico clientes;

    public ProjetoServico(ProjetoRepository projetos, ClienteServico clientes) {
        this.projetos = projetos;
        this.clientes = clientes;
    }

    @Transactional(readOnly = true)
    public List<Projeto> listar(Long clienteId) {
        return clienteId == null ? projetos.findAll() : projetos.findAllByClienteId(clienteId);
    }

    @Transactional(readOnly = true)
    public Projeto buscar(Long id) {
        return projetos.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Projeto", id));
    }

    @Transactional
    public Projeto criar(ProjetoRequisicao requisicao) {
        Projeto projeto = new Projeto();
        projeto.setCriadoEm(requisicao.criadoEm() == null ? LocalDate.now() : requisicao.criadoEm());
        aplicar(projeto, requisicao);

        return projetos.save(projeto);
    }

    @Transactional
    public Projeto atualizar(Long id, ProjetoRequisicao requisicao) {
        Projeto projeto = buscar(id);
        aplicar(projeto, requisicao);

        return projetos.save(projeto);
    }

    @Transactional
    public void excluir(Long id) {
        projetos.delete(buscar(id));
    }

    private void aplicar(Projeto projeto, ProjetoRequisicao requisicao) {
        projeto.setNome(requisicao.nome().trim());
        projeto.setCliente(clientes.buscar(requisicao.clienteId()));
    }
}
