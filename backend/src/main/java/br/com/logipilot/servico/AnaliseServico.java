package br.com.logipilot.servico;

import br.com.logipilot.dominio.Analise;
import br.com.logipilot.repositorio.AnaliseRepository;
import br.com.logipilot.web.dto.AnaliseRequisicao;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AnaliseServico {

    private final AnaliseRepository analises;
    private final ProjetoServico projetos;
    private final UsuarioServico usuarios;

    public AnaliseServico(AnaliseRepository analises,
                          ProjetoServico projetos,
                          UsuarioServico usuarios) {
        this.analises = analises;
        this.projetos = projetos;
        this.usuarios = usuarios;
    }

    @Transactional(readOnly = true)
    public List<Analise> listar(Long criadoPorId) {
        return criadoPorId == null
                ? analises.findAll()
                : analises.findAllByCriadoPorId(criadoPorId);
    }

    @Transactional(readOnly = true)
    public Analise buscar(Long id) {
        return analises.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Análise", id));
    }

    @Transactional
    public Analise criar(AnaliseRequisicao requisicao) {
        Analise analise = new Analise();
        analise.setTitulo(requisicao.titulo().trim());
        analise.setProjeto(requisicao.projetoId() == null
                ? null
                : projetos.buscar(requisicao.projetoId()));
        analise.setCriadoPor(usuarios.buscar(requisicao.criadoPorId()));
        analise.setStatus(requisicao.status() == null || requisicao.status().isBlank()
                ? "concluida"
                : requisicao.status().trim());
        analise.setCriadoEm(requisicao.criadoEm() == null ? LocalDate.now() : requisicao.criadoEm());
        analise.setSerieTemporal(requisicao.serieTemporal());
        analise.setFontes(requisicao.fontes());
        analise.setResultado(requisicao.resultado());

        return analises.save(analise);
    }

    @Transactional
    public void excluir(Long id) {
        analises.delete(buscar(id));
    }
}
