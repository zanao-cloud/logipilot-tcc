package br.com.logipilot.repositorio;

import br.com.logipilot.dominio.Entrega;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EntregaRepository extends JpaRepository<Entrega, Long> {

    List<Entrega> findAllByMotoristaIdOrderByOrdemAsc(Long motoristaId);

    List<Entrega> findAllByMotoristaIdAndDataOrderByOrdemAsc(Long motoristaId, LocalDate data);

    List<Entrega> findAllByDataOrderByOrdemAsc(LocalDate data);

    boolean existsByClienteId(Long clienteId);

    boolean existsByMotoristaId(Long motoristaId);
}
