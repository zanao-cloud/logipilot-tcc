package br.com.logipilot.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Redefinição de senha sem envio de e-mail: a pessoa confirma o telefone que
 * está no cadastro e define a nova senha.
 */
public record RecuperacaoSenhaRequisicao(
        @NotBlank(message = "Informe o e-mail.")
        @Email(message = "E-mail inválido.")
        String email,

        @NotBlank(message = "Informe o telefone cadastrado.")
        String telefone,

        @NotBlank(message = "Informe a nova senha.")
        @Size(min = 6, message = "A senha precisa ter pelo menos 6 caracteres.")
        String novaSenha) {
}
