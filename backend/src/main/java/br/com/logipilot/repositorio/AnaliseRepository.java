package br.com.logipilot.repositorio;

import br.com.logipilot.dominio.Analise;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnaliseRepository extends JpaRepository<Analise, Long> {

    List<Analise> findAllByCriadoPorId(Long criadoPorId);

    boolean existsByCriadoPorId(Long criadoPorId);
}
