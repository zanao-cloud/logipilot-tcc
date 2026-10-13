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
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Uma parada da rota de um motorista num dia. Quem cria é o operador; quem
 * fecha é o motorista, informando o desfecho e as observações do local.
 */
@Entity
@Table(name = "entrega")
public class Entrega {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "motorista_id", nullable = false)
    private Usuario motorista;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    /** O que está escrito na etiqueta da caixa: é por aqui que o motorista acha o pacote. */
    @Column(nullable = false, length = 40)
    private String codigo;

    /** Quantas caixas saem para esta mesma parada. */
    @Column(nullable = false)
    private Integer volumes = 1;

    @Column(nullable = false, length = 200)
    private String endereco;

    @Column(nullable = false, length = 120)
    private String cidade;

    @Column(name = "janela_inicio", nullable = false)
    private LocalTime janelaInicio;

    @Column(name = "janela_fim", nullable = false)
    private LocalTime janelaFim;

    @Column(name = "distancia_km", nullable = false, precision = 7, scale = 2)
    private BigDecimal distanciaKm = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Prioridade prioridade = Prioridade.NORMAL;

    @Column(name = "observacoes_operador", length = 500)
    private String observacoesOperador;

    @Column(nullable = false)
    private LocalDate data;

    /** Sequência da rota. É este campo que a otimização por IA reescreve. */
    @Column(nullable = false)
    private Integer ordem = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private StatusEntrega status = StatusEntrega.PENDENTE;

    @Column(length = 500)
    private String observacoes;

    @Column(name = "concluida_em")
    private Instant concluidaEm;

    @Column(name = "criado_em", nullable = false)
    private Instant criadoEm;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Usuario getMotorista() {
        return motorista;
    }

    public void setMotorista(Usuario motorista) {
        this.motorista = motorista;
    }

    public Cliente getCliente() {
        return cliente;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public Integer getVolumes() {
        return volumes;
    }

    public void setVolumes(Integer volumes) {
        this.volumes = volumes;
    }

    public String getEndereco() {
        return endereco;
    }

    public void setEndereco(String endereco) {
        this.endereco = endereco;
    }

    public String getCidade() {
        return cidade;
    }

    public void setCidade(String cidade) {
        this.cidade = cidade;
    }

    public LocalTime getJanelaInicio() {
        return janelaInicio;
    }

    public void setJanelaInicio(LocalTime janelaInicio) {
        this.janelaInicio = janelaInicio;
    }

    public LocalTime getJanelaFim() {
        return janelaFim;
    }

    public void setJanelaFim(LocalTime janelaFim) {
        this.janelaFim = janelaFim;
    }

    public BigDecimal getDistanciaKm() {
        return distanciaKm;
    }

    public void setDistanciaKm(BigDecimal distanciaKm) {
        this.distanciaKm = distanciaKm;
    }

    public Prioridade getPrioridade() {
        return prioridade;
    }

    public void setPrioridade(Prioridade prioridade) {
        this.prioridade = prioridade;
    }

    public String getObservacoesOperador() {
        return observacoesOperador;
    }

    public void setObservacoesOperador(String observacoesOperador) {
        this.observacoesOperador = observacoesOperador;
    }

    public LocalDate getData() {
        return data;
    }

    public void setData(LocalDate data) {
        this.data = data;
    }

    public Integer getOrdem() {
        return ordem;
    }

    public void setOrdem(Integer ordem) {
        this.ordem = ordem;
    }

    public StatusEntrega getStatus() {
        return status;
    }

    public void setStatus(StatusEntrega status) {
        this.status = status;
    }

    public String getObservacoes() {
        return observacoes;
    }

    public void setObservacoes(String observacoes) {
        this.observacoes = observacoes;
    }

    public Instant getConcluidaEm() {
        return concluidaEm;
    }

    public void setConcluidaEm(Instant concluidaEm) {
        this.concluidaEm = concluidaEm;
    }

    public Instant getCriadoEm() {
        return criadoEm;
    }

    public void setCriadoEm(Instant criadoEm) {
        this.criadoEm = criadoEm;
    }
}
