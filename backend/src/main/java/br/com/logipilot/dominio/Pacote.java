package br.com.logipilot.dominio;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * Volume que deu entrada no galpão. Existe antes da entrega: primeiro entra no
 * estoque, depois o operador decide para onde e com quem vai.
 */
@Entity
@Table(name = "pacote")
public class Pacote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** O que está escrito na etiqueta. Único em todo o sistema. */
    @Column(nullable = false, length = 40, unique = true)
    private String codigo;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @Column(nullable = false)
    private Integer volumes = 1;

    @Column(length = 200)
    private String descricao;

    @Column(name = "peso_kg", precision = 7, scale = 2)
    private BigDecimal pesoKg;

    @Column(length = 500)
    private String observacoes;

    @Column(name = "recebido_em", nullable = false)
    private Instant recebidoEm;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private StatusPacote status = StatusPacote.EM_ESTOQUE;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public Cliente getCliente() {
        return cliente;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
    }

    public Integer getVolumes() {
        return volumes;
    }

    public void setVolumes(Integer volumes) {
        this.volumes = volumes;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public BigDecimal getPesoKg() {
        return pesoKg;
    }

    public void setPesoKg(BigDecimal pesoKg) {
        this.pesoKg = pesoKg;
    }

    public String getObservacoes() {
        return observacoes;
    }

    public void setObservacoes(String observacoes) {
        this.observacoes = observacoes;
    }

    public Instant getRecebidoEm() {
        return recebidoEm;
    }

    public void setRecebidoEm(Instant recebidoEm) {
        this.recebidoEm = recebidoEm;
    }

    public StatusPacote getStatus() {
        return status;
    }

    public void setStatus(StatusPacote status) {
        this.status = status;
    }
}
