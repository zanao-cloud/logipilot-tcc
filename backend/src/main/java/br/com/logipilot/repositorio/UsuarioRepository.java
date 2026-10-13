package br.com.logipilot.repositorio;

import br.com.logipilot.dominio.Papel;
import br.com.logipilot.dominio.Usuario;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByEmailIgnoreCase(String email);

    List<Usuario> findAllByEmailIgnoreCase(String email);

    List<Usuario> findAllByPapel(Papel papel);

    boolean existsByEmailIgnoreCase(String email);
}
