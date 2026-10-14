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
        String cep,
        String logradouro,
        String numero,
        String complemento,
        String bairro,
        String cidade,
        String uf,
        /* Montado a partir do logradouro, número e complemento. */
        String endereco,
        LocalDate criadoEm) {

    public static ClienteResposta de(Cliente cliente) {
        return new ClienteResposta(
                cliente.getId(),
                cliente.getNome(),
                cliente.getDocumento(),
                cliente.getResponsavel(),
                cliente.getTelefone(),
                cliente.getEmail(),
                cliente.getCep(),
                cliente.getLogradouro(),
                cliente.getNumero(),
                cliente.getComplemento(),
                cliente.getBairro(),
                cliente.getCidade(),
                cliente.getUf(),
                cliente.getEndereco(),
                cliente.getCriadoEm());
    }
}
