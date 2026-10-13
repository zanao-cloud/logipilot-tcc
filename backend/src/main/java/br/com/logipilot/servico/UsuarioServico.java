package br.com.logipilot.servico;

import br.com.logipilot.dominio.Papel;
import br.com.logipilot.dominio.Usuario;
import br.com.logipilot.repositorio.AnaliseRepository;
import br.com.logipilot.repositorio.EntregaRepository;
import br.com.logipilot.repositorio.UsuarioRepository;
import br.com.logipilot.web.dto.UsuarioRequisicao;
import java.util.List;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UsuarioServico {

    private final UsuarioRepository usuarios;
    private final EntregaRepository entregas;
    private final AnaliseRepository analises;
    private final PasswordEncoder codificador;

    public UsuarioServico(UsuarioRepository usuarios,
                          EntregaRepository entregas,
                          AnaliseRepository analises,
                          PasswordEncoder codificador) {
        this.usuarios = usuarios;
        this.entregas = entregas;
        this.analises = analises;
        this.codificador = codificador;
    }

    @Transactional(readOnly = true)
    public List<Usuario> listar(String email, Papel papel) {
        if (email != null && !email.isBlank()) {
            return usuarios.findAllByEmailIgnoreCase(email.trim());
        }
        if (papel != null) {
            return usuarios.findAllByPapel(papel);
        }
        return usuarios.findAll();
    }

    @Transactional(readOnly = true)
    public Usuario buscar(Long id) {
        return usuarios.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário", id));
    }

    @Transactional
    public Usuario criar(UsuarioRequisicao requisicao) {
        String email = normalizarEmail(requisicao.email());

        if (usuarios.existsByEmailIgnoreCase(email)) {
            throw new RegraDeNegocioException("Já existe um acesso cadastrado com este e-mail.");
        }
        if (requisicao.senha() == null || requisicao.senha().isBlank()) {
            throw new RegraDeNegocioException("Informe uma senha de pelo menos 6 caracteres.");
        }

        Usuario usuario = new Usuario();
        usuario.setSenha(codificador.encode(requisicao.senha()));
        // Sem papel informado, a conta é a do gestor criada pela tela pública.
        usuario.setPapel(requisicao.papel() == null ? Papel.GESTOR : requisicao.papel());
        aplicar(usuario, requisicao, email);

        return usuarios.save(usuario);
    }

    @Transactional
    public Usuario atualizar(Long id, UsuarioRequisicao requisicao) {
        Usuario usuario = buscar(id);
        String email = normalizarEmail(requisicao.email());

        usuarios.findByEmailIgnoreCase(email)
                .filter(outro -> !outro.getId().equals(id))
                .ifPresent(outro -> {
                    throw new RegraDeNegocioException("Já existe outro acesso cadastrado com este e-mail.");
                });

        // Senha em branco na edição significa "manter a atual".
        if (requisicao.senha() != null && !requisicao.senha().isBlank()) {
            usuario.setSenha(codificador.encode(requisicao.senha()));
        }
        if (requisicao.papel() != null) {
            usuario.setPapel(requisicao.papel());
        }
        aplicar(usuario, requisicao, email);

        return usuarios.save(usuario);
    }

    @Transactional
    public void excluir(Long id) {
        Usuario usuario = buscar(id);

        if (entregas.existsByMotoristaId(id)) {
            throw new RegraDeNegocioException(
                    "Este motorista tem entregas registradas e não pode ser excluído.");
        }
        if (analises.existsByCriadoPorId(id)) {
            throw new RegraDeNegocioException(
                    "Este acesso tem análises registradas e não pode ser excluído.");
        }

        usuarios.delete(usuario);
    }

    private void aplicar(Usuario usuario, UsuarioRequisicao requisicao, String email) {
        usuario.setNome(requisicao.nome().trim());
        usuario.setEmail(email);
        usuario.setTelefone(textoOuNulo(requisicao.telefone()));

        boolean motorista = usuario.getPapel() == Papel.MOTORISTA;
        usuario.setPlaca(motorista && requisicao.placa() != null
                ? requisicao.placa().trim().toUpperCase()
                : null);
    }

    private String normalizarEmail(String email) {
        return email.trim().toLowerCase();
    }

    private String textoOuNulo(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }
}
