package br.com.logipilot.repositorio;

import br.com.logipilot.dominio.Pacote;
import br.com.logipilot.dominio.StatusPacote;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PacoteRepository extends JpaRepository<Pacote, Long> {

    Optional<Pacote> findByCodigoIgnoreCase(String codigo);

    boolean existsByCodigoIgnoreCase(String codigo);

    List<Pacote> findAllByStatusOrderByRecebidoEmAsc(StatusPacote status);

    List<Pacote> findAllByOrderByRecebidoEmDesc();

    boolean existsByClienteId(Long clienteId);
}
