package br.com.logipilot.dominio;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * Resultado de uma análise gerada pela IA. O retorno do modelo não tem forma
 * fixa (indicadores, gargalos, plano de ação, previsões...), então os três
 * campos abaixo ficam guardados como JSON em vez de virar novas tabelas.
 */
@Entity
@Table(name = "analise")
public class Analise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 160)
    private String titulo;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "projeto_id")
    private Projeto projeto;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "criado_por_id", nullable = false)
    private Usuario criadoPor;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "criado_em", nullable = false)
    private LocalDate criadoEm;

    // No SQL Server o SqlTypes.JSON vira NVARCHAR(MAX); o ISJSON na tabela
    // garante que só entra JSON válido.
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "serie_temporal", columnDefinition = "nvarchar(max)")
    private JsonNode serieTemporal;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "nvarchar(max)")
    private JsonNode fontes;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "nvarchar(max)")
    private JsonNode resultado;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public Projeto getProjeto() {
        return projeto;
    }

    public void setProjeto(Projeto projeto) {
        this.projeto = projeto;
    }

    public Usuario getCriadoPor() {
        return criadoPor;
    }

    public void setCriadoPor(Usuario criadoPor) {
        this.criadoPor = criadoPor;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDate getCriadoEm() {
        return criadoEm;
    }

    public void setCriadoEm(LocalDate criadoEm) {
        this.criadoEm = criadoEm;
    }

    public JsonNode getSerieTemporal() {
        return serieTemporal;
    }

    public void setSerieTemporal(JsonNode serieTemporal) {
        this.serieTemporal = serieTemporal;
    }

    public JsonNode getFontes() {
        return fontes;
    }

    public void setFontes(JsonNode fontes) {
        this.fontes = fontes;
    }

    public JsonNode getResultado() {
        return resultado;
    }

    public void setResultado(JsonNode resultado) {
        this.resultado = resultado;
    }
}
