package br.com.logipilot.web.dto;

import br.com.logipilot.dominio.Pacote;
import br.com.logipilot.dominio.StatusPacote;
import java.math.BigDecimal;
import java.time.Instant;

public record PacoteResposta(
        Long id,
        String codigo,
        Long clienteId,
        String cliente,
        /* Endereço e cidade do destinatário, para a designação já vir preenchida. */
        String endereco,
        String cidade,
        Integer volumes,
        String descricao,
        BigDecimal pesoKg,
        String observacoes,
        Instant recebidoEm,
        StatusPacote status) {

    public static PacoteResposta de(Pacote pacote) {
        return new PacoteResposta(
                pacote.getId(),
                pacote.getCodigo(),
                pacote.getCliente().getId(),
                pacote.getCliente().getNome(),
                pacote.getCliente().getEndereco(),
                pacote.getCliente().getCidade(),
                pacote.getVolumes(),
                pacote.getDescricao(),
                pacote.getPesoKg(),
                pacote.getObservacoes(),
                pacote.getRecebidoEm(),
                pacote.getStatus());
    }
}
