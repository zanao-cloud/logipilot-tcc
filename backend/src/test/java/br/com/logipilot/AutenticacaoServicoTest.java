package br.com.logipilot;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import br.com.logipilot.dominio.Papel;
import br.com.logipilot.dominio.Usuario;
import br.com.logipilot.repositorio.UsuarioRepository;
import br.com.logipilot.servico.AutenticacaoServico;
import br.com.logipilot.servico.CredenciaisInvalidasException;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AutenticacaoServicoTest {

    @Mock
    private UsuarioRepository usuarios;

    private AutenticacaoServico autenticacao;
    private Usuario gestor;

    @BeforeEach
    void preparar() {
        PasswordEncoder codificador = new BCryptPasswordEncoder();
        autenticacao = new AutenticacaoServico(usuarios, codificador);

        gestor = new Usuario();
        gestor.setId(1L);
        gestor.setNome("Gestor de Teste");
        gestor.setEmail("gestor@teste.com");
        gestor.setSenha(codificador.encode("senha-correta"));
        gestor.setPapel(Papel.GESTOR);
    }

    @Test
    @DisplayName("autentica quando a senha confere com o hash BCrypt guardado")
    void autenticaComSenhaCorreta() {
        when(usuarios.findByEmailIgnoreCase("gestor@teste.com")).thenReturn(Optional.of(gestor));

        Usuario autenticado = autenticacao.autenticar("Gestor@Teste.com ", "senha-correta");

        assertThat(autenticado.getId()).isEqualTo(1L);
        assertThat(autenticado.getPapel()).isEqualTo(Papel.GESTOR);
    }

    @Test
    @DisplayName("recusa a senha errada sem dizer que o e-mail existe")
    void recusaSenhaErrada() {
        when(usuarios.findByEmailIgnoreCase("gestor@teste.com")).thenReturn(Optional.of(gestor));

        assertThatThrownBy(() -> autenticacao.autenticar("gestor@teste.com", "outra-senha"))
                .isInstanceOf(CredenciaisInvalidasException.class)
                .hasMessage("E-mail ou senha inválidos.");
    }

    @Test
    @DisplayName("e-mail inexistente devolve a mesma mensagem da senha errada")
    void recusaEmailInexistente() {
        when(usuarios.findByEmailIgnoreCase(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> autenticacao.autenticar("ninguem@teste.com", "qualquer"))
                .isInstanceOf(CredenciaisInvalidasException.class)
                .hasMessage("E-mail ou senha inválidos.");
    }
}
