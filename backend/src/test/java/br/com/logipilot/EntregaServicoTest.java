package br.com.logipilot;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import br.com.logipilot.dominio.Cliente;
import br.com.logipilot.dominio.Entrega;
import br.com.logipilot.dominio.Papel;
import br.com.logipilot.dominio.Prioridade;
import br.com.logipilot.dominio.StatusEntrega;
import br.com.logipilot.dominio.Usuario;
import br.com.logipilot.repositorio.EntregaRepository;
import br.com.logipilot.servico.ClienteServico;
import br.com.logipilot.servico.EntregaServico;
import br.com.logipilot.servico.RegraDeNegocioException;
import br.com.logipilot.servico.UsuarioServico;
import br.com.logipilot.web.dto.EntregaAtualizacao;
import br.com.logipilot.web.dto.EntregaRequisicao;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class EntregaServicoTest {

    @Mock
    private EntregaRepository entregas;

    @Mock
    private UsuarioServico usuarios;

    @Mock
    private ClienteServico clientes;

    private EntregaServico servico;
    private Usuario motorista;
    private Cliente cliente;

    @BeforeEach
    void preparar() {
        servico = new EntregaServico(entregas, usuarios, clientes);

        motorista = new Usuario();
        motorista.setId(2L);
        motorista.setNome("TH");
        motorista.setPapel(Papel.MOTORISTA);

        cliente = new Cliente();
        cliente.setId(1L);
        cliente.setNome("Mercado Azul");

        when(usuarios.buscar(2L)).thenReturn(motorista);
        when(clientes.buscar(1L)).thenReturn(cliente);
        when(entregas.save(any(Entrega.class))).thenAnswer(chamada -> chamada.getArgument(0));
    }

    private EntregaRequisicao requisicao(LocalTime inicio, LocalTime fim) {
        return new EntregaRequisicao(2L, 1L, "cx-1042", 3, "Rua das Flores, 120", "São Paulo",
                inicio, fim, new BigDecimal("12.5"), Prioridade.ALTA, "doca dos fundos",
                LocalDate.of(2026, 10, 16), null);
    }

    @Test
    @DisplayName("a parada entra no fim da rota daquele motorista naquele dia")
    void designaNaProximaPosicao() {
        Entrega existente = new Entrega();
        existente.setOrdem(3);
        when(entregas.findAllByMotoristaIdAndDataOrderByOrdemAsc(2L, LocalDate.of(2026, 10, 16)))
                .thenReturn(List.of(existente));

        Entrega entrega = servico.designar(requisicao(LocalTime.of(8, 0), LocalTime.of(12, 0)));

        assertThat(entrega.getOrdem()).isEqualTo(4);
        assertThat(entrega.getStatus()).isEqualTo(StatusEntrega.PENDENTE);
        assertThat(entrega.getMotorista()).isSameAs(motorista);
    }

    @Test
    @DisplayName("a identificação do pacote é guardada em maiúsculas")
    void normalizaOCodigoDoPacote() {
        Entrega entrega = servico.designar(requisicao(LocalTime.of(8, 0), LocalTime.of(12, 0)));

        assertThat(entrega.getCodigo()).isEqualTo("CX-1042");
        assertThat(entrega.getVolumes()).isEqualTo(3);
    }

    @Test
    @DisplayName("recusa dois pacotes com a mesma identificação na rota do dia")
    void recusaCodigoRepetidoNaRota() {
        when(entregas.existsByCodigoIgnoreCaseAndMotoristaIdAndData(
                "CX-1042", 2L, LocalDate.of(2026, 10, 16))).thenReturn(true);

        assertThatThrownBy(() -> servico.designar(requisicao(LocalTime.of(8, 0), LocalTime.of(12, 0))))
                .isInstanceOf(RegraDeNegocioException.class)
                .hasMessageContaining("CX-1042");
    }

    @Test
    @DisplayName("recusa janela que termina antes de começar")
    void recusaJanelaInvertida() {
        assertThatThrownBy(() -> servico.designar(requisicao(LocalTime.of(14, 0), LocalTime.of(9, 0))))
                .isInstanceOf(RegraDeNegocioException.class)
                .hasMessageContaining("depois do início");
    }

    @Test
    @DisplayName("recusa designar entrega a quem não é motorista")
    void recusaQuemNaoEhMotorista() {
        motorista.setPapel(Papel.OPERADOR);

        assertThatThrownBy(() -> servico.designar(requisicao(LocalTime.of(8, 0), LocalTime.of(12, 0))))
                .isInstanceOf(RegraDeNegocioException.class)
                .hasMessageContaining("motoristas");
    }

    @Test
    @DisplayName("ausência sem observação é recusada")
    void exigeObservacaoNaAusencia() {
        when(entregas.findById(10L)).thenReturn(Optional.of(new Entrega()));

        assertThatThrownBy(() -> servico.atualizarParcialmente(10L,
                new EntregaAtualizacao(StatusEntrega.AUSENTE, "  ", null, null, null, null)))
                .isInstanceOf(RegraDeNegocioException.class)
                .hasMessageContaining("Descreva o que aconteceu");
    }

    @Test
    @DisplayName("voltar para pendente apaga o horário e a observação do registro")
    void desfazerLimpaRegistro() {
        Entrega entrega = new Entrega();
        entrega.setStatus(StatusEntrega.ENTREGUE);
        entrega.setObservacoes("recebido pelo gerente");
        entrega.setConcluidaEm(Instant.now());
        when(entregas.findById(10L)).thenReturn(Optional.of(entrega));

        Entrega desfeita = servico.atualizarParcialmente(10L,
                new EntregaAtualizacao(StatusEntrega.PENDENTE, null, null, null, null, null));

        assertThat(desfeita.getStatus()).isEqualTo(StatusEntrega.PENDENTE);
        assertThat(desfeita.getObservacoes()).isNull();
        assertThat(desfeita.getConcluidaEm()).isNull();
    }

    @Test
    @DisplayName("a otimização de rota só mexe na ordem, sem tocar no desfecho")
    void reordenaSemAlterarStatus() {
        Entrega entrega = new Entrega();
        entrega.setStatus(StatusEntrega.ENTREGUE);
        entrega.setObservacoes("ok");
        entrega.setOrdem(5);
        when(entregas.findById(10L)).thenReturn(Optional.of(entrega));

        Entrega reordenada = servico.atualizarParcialmente(10L,
                new EntregaAtualizacao(null, null, null, null, 1, null));

        assertThat(reordenada.getOrdem()).isEqualTo(1);
        assertThat(reordenada.getStatus()).isEqualTo(StatusEntrega.ENTREGUE);
        assertThat(reordenada.getObservacoes()).isEqualTo("ok");
    }
}
