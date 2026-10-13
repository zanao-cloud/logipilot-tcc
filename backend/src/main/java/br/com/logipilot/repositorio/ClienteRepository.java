package br.com.logipilot.repositorio;

import br.com.logipilot.dominio.Cliente;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    Optional<Cliente> findByNomeIgnoreCase(String nome);
}
