package br.com.logipilot.web.dto;

import br.com.logipilot.dominio.Projeto;
import java.time.LocalDate;

/**
 * O nome do cliente vai junto ({@code cliente}) para a listagem não precisar de
 * uma segunda chamada, mas quem manda é sempre o {@code clienteId}.
 */
public record ProjetoResposta(
        Long id,
        String nome,
        Long clienteId,
        String cliente,
        LocalDate criadoEm) {

    public static ProjetoResposta de(Projeto projeto) {
        return new ProjetoResposta(
                projeto.getId(),
                projeto.getNome(),
                projeto.getCliente().getId(),
                projeto.getCliente().getNome(),
                projeto.getCriadoEm());
    }
}
