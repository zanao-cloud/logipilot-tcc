package br.com.logipilot.web.dto;

import br.com.logipilot.dominio.Cliente;
import java.time.LocalDate;

public record ClienteResposta(
        Long id,
        String nome,
        String documento,
        String responsavel,
        String telefone,
        String email,
        String endereco,
        String cidade,
        LocalDate criadoEm) {

    public static ClienteResposta de(Cliente cliente) {
        return new ClienteResposta(
                cliente.getId(),
                cliente.getNome(),
                cliente.getDocumento(),
                cliente.getResponsavel(),
                cliente.getTelefone(),
                cliente.getEmail(),
                cliente.getEndereco(),
                cliente.getCidade(),
                cliente.getCriadoEm());
    }
}
