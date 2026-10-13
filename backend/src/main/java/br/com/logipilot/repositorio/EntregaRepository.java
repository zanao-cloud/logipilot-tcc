package br.com.logipilot.repositorio;

import br.com.logipilot.dominio.Entrega;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface EntregaRepository extends JpaRepository<Entrega, Long> {

    List<Entrega> findAllByMotoristaIdOrderByOrdemAsc(Long motoristaId);

    List<Entrega> findAllByMotoristaIdAndDataOrderByOrdemAsc(Long motoristaId, LocalDate data);

    List<Entrega> findAllByDataOrderByOrdemAsc(LocalDate data);

    List<Entrega> findAllByDataBetweenOrderByDataAscOrdemAsc(LocalDate inicio, LocalDate fim);

    boolean existsByCodigoIgnoreCaseAndMotoristaIdAndData(String codigo, Long motoristaId, LocalDate data);

    boolean existsByClienteId(Long clienteId);

    boolean existsByMotoristaId(Long motoristaId);

    boolean existsByReagendadaDeId(Long reagendadaDeId);

    /**
     * Fila de reagendamento: paradas em que não havia ninguém no local e que
     * ainda não geraram uma nova tentativa.
     */
    @Query("SELECT e FROM Entrega e "
            + "WHERE e.status = br.com.logipilot.dominio.StatusEntrega.AUSENTE "
            + "AND NOT EXISTS (SELECT 1 FROM Entrega nova WHERE nova.reagendadaDe = e) "
            + "ORDER BY e.data DESC, e.ordem ASC")
    List<Entrega> buscarPendentesDeReagendamento();
}
