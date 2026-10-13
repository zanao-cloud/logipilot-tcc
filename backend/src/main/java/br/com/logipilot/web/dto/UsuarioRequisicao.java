package br.com.logipilot.web.dto;

import br.com.logipilot.dominio.Papel;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * A senha chega em texto e é hasheada com BCrypt no servidor. Na edição ela é
 * opcional: vindo em branco, a senha atual é mantida.
 */
public record UsuarioRequisicao(
        @NotBlank(message = "Informe o nome.")
        String nome,

        @NotBlank(message = "Informe o e-mail.")
        @Email(message = "E-mail inválido.")
        String email,

        @Size(min = 6, message = "A senha precisa ter pelo menos 6 caracteres.")
        String senha,

        Papel papel,
        String telefone,
        String placa) {
}
