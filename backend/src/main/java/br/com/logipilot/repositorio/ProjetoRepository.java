package br.com.logipilot.repositorio;

import br.com.logipilot.dominio.Projeto;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjetoRepository extends JpaRepository<Projeto, Long> {

    List<Projeto> findAllByClienteId(Long clienteId);

    boolean existsByClienteId(Long clienteId);
}
