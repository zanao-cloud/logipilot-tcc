package br.com.logipilot.web.dto;

import br.com.logipilot.dominio.Papel;
import br.com.logipilot.dominio.Usuario;

/** O hash da senha nunca sai da API. */
public record UsuarioResposta(
        Long id,
        String nome,
        String email,
        Papel papel,
        String telefone,
        String placa) {

    public static UsuarioResposta de(Usuario usuario) {
        return new UsuarioResposta(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getPapel(),
                usuario.getTelefone(),
                usuario.getPlaca());
    }
}
