package br.com.logipilot;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.logipilot.dominio.Formatos;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class FormatosTest {

    @ParameterizedTest
    @ValueSource(strings = {"ABC1D23", "abc1d23", "ABC-1234", "ABC1234", "xyz9z99"})
    @DisplayName("aceita placa Mercosul e placa antiga, com ou sem traço e em minúsculas")
    void aceitaPlacasValidas(String placa) {
        assertThat(Formatos.placaValida(Formatos.normalizarPlaca(placa))).isTrue();
    }

    @ParameterizedTest
    @ValueSource(strings = {"ABCDE", "AB1234", "ABCD123", "1234567", "AAA1AA3", "ABC12345", "ABC123"})
    @DisplayName("recusa placa fora dos dois padrões")
    void recusaPlacasInvalidas(String placa) {
        assertThat(Formatos.placaValida(Formatos.normalizarPlaca(placa))).isFalse();
    }

    @ParameterizedTest
    @ValueSource(strings = {"11939369341", "(11) 93936-9341", "1133224455", "(21) 3344-5566", "11 9 3936 9341"})
    @DisplayName("aceita celular com 9 dígitos e fixo com 8, com ou sem máscara")
    void aceitaTelefonesValidos(String telefone) {
        assertThat(Formatos.telefoneValido(Formatos.normalizarTelefone(telefone))).isTrue();
    }

    @ParameterizedTest
    @ValueSource(strings = {"999999", "01912345678", "11123456789", "119393693412", "939369341", "10939369341"})
    @DisplayName("recusa número curto, DDD inválido e celular sem o nono dígito")
    void recusaTelefonesInvalidos(String telefone) {
        assertThat(Formatos.telefoneValido(Formatos.normalizarTelefone(telefone))).isFalse();
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "   "})
    @DisplayName("campo em branco vira nulo, e não erro")
    void brancoViraNulo(String vazio) {
        assertThat(Formatos.normalizarPlaca(vazio)).isNull();
        assertThat(Formatos.normalizarTelefone(vazio)).isNull();
    }

    @ParameterizedTest
    @ValueSource(strings = {"abc-1d23", "ABC 1D23", "abc1d23"})
    @DisplayName("a placa é guardada sempre em maiúsculas e sem separador")
    void normalizaAPlaca(String placa) {
        assertThat(Formatos.normalizarPlaca(placa)).isEqualTo("ABC1D23");
    }

    @ParameterizedTest
    @ValueSource(strings = {"(11) 93936-9341", "11 93936 9341", "11939369341", "+55 11 93936-9341"})
    @DisplayName("o telefone é guardado só com dígitos")
    void normalizaOTelefone(String telefone) {
        assertThat(Formatos.normalizarTelefone(telefone)).endsWith("11939369341");
    }
}
