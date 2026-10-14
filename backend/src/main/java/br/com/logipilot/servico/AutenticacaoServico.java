package br.com.logipilot.servico;

import br.com.logipilot.dominio.Formatos;
import br.com.logipilot.dominio.Usuario;
import br.com.logipilot.repositorio.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AutenticacaoServico {

    private final UsuarioRepository usuarios;
    private final PasswordEncoder codificador;

    public AutenticacaoServico(UsuarioRepository usuarios, PasswordEncoder codificador) {
        this.usuarios = usuarios;
        this.codificador = codificador;
    }

    /**
     * A senha digitada é comparada com o hash BCrypt guardado. A mesma mensagem
     * vale para e-mail inexistente e senha errada, para não revelar quais
     * e-mails estão cadastrados.
     */
    /**
     * Redefinição sem envio de e-mail: a pessoa confirma o telefone que está no
     * cadastro. É uma verificação fraca — quem souber e-mail e telefone troca a
     * senha — e está declarada como limitação conhecida do projeto.
     */
    @Transactional
    public void redefinirSenha(String email, String telefone, String novaSenha) {
        String telefoneInformado = Formatos.normalizarTelefone(telefone);

        Usuario usuario = usuarios.findByEmailIgnoreCase(email.trim().toLowerCase())
                .filter(u -> u.getTelefone() != null)
                .filter(u -> u.getTelefone().equals(telefoneInformado))
                .orElseThrow(() -> new RegraDeNegocioException(
                        "E-mail e telefone não conferem com nenhum cadastro."));

        usuario.setSenha(codificador.encode(novaSenha));
        usuarios.save(usuario);
    }

    @Transactional(readOnly = true)
    public Usuario autenticar(String email, String senha) {
        return usuarios.findByEmailIgnoreCase(email.trim().toLowerCase())
                .filter(usuario -> codificador.matches(senha, usuario.getSenha()))
                .orElseThrow(CredenciaisInvalidasException::new);
    }
}
