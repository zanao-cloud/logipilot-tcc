import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../../services/api'
import SidebarOperador from '../../components/SidebarOperador'
import CredentialUser from '../../components/CredentialUser'
import Modal from '../../components/Modal'
import { formatarData } from '../../services/formatadores'
import {
  calcularKpis,
  foiConcluida,
  hojeISO,
  horaDaConclusao,
  ordenarEntregas,
  statusInfo,
} from '../../services/entregas'
import styles from './DesignarEntregas.module.css'

const entregaEmBranco = () => ({
  clienteId: '',
  cliente: '',
  endereco: '',
  cidade: '',
  janelaInicio: '08:00',
  janelaFim: '12:00',
  distanciaKm: '',
  prioridade: 'normal',
  observacoesOperador: '',
  data: hojeISO(),
})

const DesignarEntregas = () => {
  const { id } = useParams()
  const [motorista, setMotorista] = useState(null)
  const [clientes, setClientes] = useState([])
  const [entregas, setEntregas] = useState([])
  const [form, setForm] = useState(entregaEmBranco)
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [idEntregaAExcluir, setIdEntregaAExcluir] = useState(null)

  useEffect(() => {
    Promise.all([api.get(`/usuarios/${id}`), api.get('/clientes'), api.get('/entregas')])
      .then(([respostaMotorista, respostaClientes, respostaEntregas]) => {
        setMotorista(respostaMotorista.data)
        setClientes(respostaClientes.data)
        setEntregas(respostaEntregas.data.filter((e) => String(e.motoristaId) === String(id)))
      })
      .catch((error) => {
        console.error('Erro ao carregar a designação de entregas.', error)
        setErro('Não foi possível carregar os dados deste motorista.')
      })
      .finally(() => setCarregando(false))
  }, [id])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // Escolher o cliente já traz o endereço cadastrado, que continua editável
  // (a entrega pode ser numa filial ou num endereço avulso).
  const escolherCliente = (e) => {
    const clienteId = e.target.value
    const cliente = clientes.find((c) => String(c.id) === String(clienteId))

    setForm((prev) => ({
      ...prev,
      clienteId,
      cliente: cliente ? cliente.nome : '',
      endereco: cliente ? cliente.endereco || '' : '',
      cidade: cliente ? cliente.cidade || '' : '',
    }))
  }

  const designarEntrega = async (e) => {
    e.preventDefault()
    setErro('')
    setAviso('')

    const cliente = clientes.find((c) => String(c.id) === String(form.clienteId))
    if (!cliente) {
      setErro('Selecione um cliente cadastrado.')
      return
    }

    if (form.janelaInicio && form.janelaFim && form.janelaFim <= form.janelaInicio) {
      setErro('O fim da janela de entrega precisa ser depois do início.')
      return
    }

    setEnviando(true)

    try {
      const doDia = entregas.filter((entrega) => entrega.data === form.data)
      const maiorOrdem = doDia.reduce((maior, entrega) => Math.max(maior, Number(entrega.ordem) || 0), 0)

      const nova = {
        motoristaId: String(id),
        clienteId: cliente.id,
        cliente: cliente.nome,
        endereco: form.endereco.trim(),
        cidade: form.cidade.trim(),
        janelaInicio: form.janelaInicio,
        janelaFim: form.janelaFim,
        distanciaKm: Number(form.distanciaKm) || 0,
        prioridade: form.prioridade,
        observacoesOperador: form.observacoesOperador.trim(),
        data: form.data,
        ordem: maiorOrdem + 1,
        status: 'pendente',
        observacoes: '',
        concluidaEm: null,
        criadoEm: new Date().toISOString(),
      }

      const resposta = await api.post('/entregas', nova)
      setEntregas((atuais) => [...atuais, resposta.data])
      setForm({ ...entregaEmBranco(), data: form.data })
      setAviso(`Entrega para ${cliente.nome} designada.`)
    } catch (error) {
      console.error('Não foi possível designar a entrega.', error)
      setErro('Não foi possível designar a entrega. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  const excluirEntrega = async () => {
    try {
      await api.delete(`/entregas/${idEntregaAExcluir}`)
      setEntregas((atuais) => atuais.filter((entrega) => entrega.id !== idEntregaAExcluir))
    } catch (error) {
      console.error('Não foi possível remover a entrega.', error)
      setErro('Não foi possível remover a entrega.')
    }
    setIdEntregaAExcluir(null)
  }

  const entregasDoDia = ordenarEntregas(entregas.filter((entrega) => entrega.data === form.data))
  const kpis = calcularKpis(entregasDoDia)

  return (
    <div className="app-shell d-flex flex-column flex-md-row">
      <SidebarOperador />

      <main className="app-main flex-grow-1">
        <CredentialUser title="Designar Entregas" />

        {erro && <div className="alert alert-danger" role="alert">{erro}</div>}
        {aviso && <div className="alert alert-success py-2" role="status">{aviso}</div>}
        {carregando && <p className="text-muted">Carregando dados do motorista...</p>}

        {motorista && (
          <>
            <div className="content-card card shadow-sm mb-4">
              <div className="card-body d-flex flex-wrap justify-content-between align-items-center gap-3">
                <div>
                  <h2 className="h5 mb-1">{motorista.nome}</h2>
                  <p className="mb-0 text-muted">
                    Placa {motorista.placa || '—'} · {motorista.telefone || 'sem telefone'}
                  </p>
                </div>
                <div className="d-flex gap-4 text-center">
                  <div>
                    <div className="h4 mb-0">{kpis.total}</div>
                    <small className="text-muted">Designadas</small>
                  </div>
                  <div>
                    <div className="h4 mb-0">{kpis.pendentes}</div>
                    <small className="text-muted">Pendentes</small>
                  </div>
                  <div>
                    <div className="h4 mb-0">{kpis.kmPlanejados}</div>
                    <small className="text-muted">Km previstos</small>
                  </div>
                </div>
                <Link to="/operador/motoristas" className="btn btn-sm btn-outline-primary">
                  <i className="fas fa-arrow-left me-1"></i>Voltar
                </Link>
              </div>
            </div>

            <div className="row g-4">
              <div className="col-lg-5">
                <form className="content-card card shadow-sm h-100" onSubmit={designarEntrega}>
                  <div className="card-body">
                    <h2 className="h6 mb-3">Nova entrega</h2>

                    <div className="mb-3">
                      <label className="form-label" htmlFor="clienteId">Cliente</label>
                      <select
                        id="clienteId"
                        className="form-select"
                        name="clienteId"
                        value={form.clienteId}
                        onChange={escolherCliente}
                        required
                      >
                        <option value="">Selecione um cliente</option>
                        {clientes.map((cliente) => (
                          <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>
                        ))}
                      </select>
                      {clientes.length === 0 && (
                        <div className="form-text text-danger">
                          Nenhum cliente cadastrado. Peça ao gestor para cadastrar os clientes.
                        </div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label className="form-label" htmlFor="endereco">Endereço</label>
                      <input id="endereco" className="form-control" name="endereco" value={form.endereco} onChange={handleChange} required />
                    </div>

                    <div className="mb-3">
                      <label className="form-label" htmlFor="cidade">Cidade / bairro</label>
                      <input id="cidade" className="form-control" name="cidade" value={form.cidade} onChange={handleChange} required />
                    </div>

                    <div className="row">
                      <div className="col-6 mb-3">
                        <label className="form-label" htmlFor="janelaInicio">Janela — início</label>
                        <input id="janelaInicio" type="time" className="form-control" name="janelaInicio" value={form.janelaInicio} onChange={handleChange} required />
                      </div>
                      <div className="col-6 mb-3">
                        <label className="form-label" htmlFor="janelaFim">Janela — fim</label>
                        <input id="janelaFim" type="time" className="form-control" name="janelaFim" value={form.janelaFim} onChange={handleChange} required />
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-6 mb-3">
                        <label className="form-label" htmlFor="distanciaKm">Distância (km)</label>
                        <input
                          id="distanciaKm"
                          type="number"
                          min="0"
                          step="0.1"
                          className="form-control"
                          name="distanciaKm"
                          value={form.distanciaKm}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="col-6 mb-3">
                        <label className="form-label" htmlFor="prioridade">Prioridade</label>
                        <select id="prioridade" className="form-select" name="prioridade" value={form.prioridade} onChange={handleChange}>
                          <option value="normal">Normal</option>
                          <option value="alta">Alta</option>
                        </select>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label" htmlFor="data">Data da rota</label>
                      <input id="data" type="date" className="form-control" name="data" value={form.data} onChange={handleChange} required />
                    </div>

                    <div className="mb-3">
                      <label className="form-label" htmlFor="observacoesOperador">Instruções para o motorista</label>
                      <textarea
                        id="observacoesOperador"
                        className="form-control"
                        name="observacoesOperador"
                        rows={2}
                        value={form.observacoesOperador}
                        onChange={handleChange}
                        placeholder="Ex: entregar na doca dos fundos, procurar pelo Sr. Carlos."
                      />
                    </div>

                    <button type="submit" className="btn btn-primary w-100" disabled={enviando || clientes.length === 0}>
                      {enviando ? 'Designando...' : 'Designar entrega'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="col-lg-7">
                <div className="content-card card shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h2 className="h6 mb-0">Rota de {formatarData(form.data)}</h2>
                      <span className="badge bg-primary">{entregasDoDia.length} entrega(s)</span>
                    </div>

                    {entregasDoDia.length === 0 && (
                      <p className="text-muted mb-0">
                        Nenhuma entrega designada nesta data. O motorista vai ver a página dele vazia.
                      </p>
                    )}

                    <ul className="list-unstyled mb-0">
                      {entregasDoDia.map((entrega, indice) => {
                        const info = statusInfo(entrega.status)

                        return (
                          <li key={entrega.id} className={styles.item}>
                            <div className={styles.ordem}>{indice + 1}</div>
                            <div className="flex-grow-1">
                              <div className="d-flex flex-wrap align-items-center gap-2">
                                <span className="fw-semibold">{entrega.cliente}</span>
                                <span className={`badge ${info.cor}`}>{info.rotulo}</span>
                                {entrega.prioridade === 'alta' && <span className="badge bg-danger">Prioridade alta</span>}
                              </div>
                              <div className="small text-muted">{entrega.endereco} · {entrega.cidade}</div>
                              <div className="small text-muted">
                                Janela {entrega.janelaInicio}–{entrega.janelaFim} · {entrega.distanciaKm} km
                                {foiConcluida(entrega) && horaDaConclusao(entrega) && ` · registrada às ${horaDaConclusao(entrega)}`}
                              </div>
                              {entrega.observacoesOperador && (
                                <div className="small"><i className="fas fa-circle-info me-1 text-muted"></i>{entrega.observacoesOperador}</div>
                              )}
                              {entrega.observacoes && (
                                <div className="small text-primary-emphasis">
                                  <i className="fas fa-comment-dots me-1"></i>Motorista: {entrega.observacoes}
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger flex-shrink-0"
                              onClick={() => setIdEntregaAExcluir(entrega.id)}
                              aria-label={`Remover entrega de ${entrega.cliente}`}
                            >
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <Modal
        isOpen={Boolean(idEntregaAExcluir)}
        onClose={() => setIdEntregaAExcluir(null)}
        onConfirm={excluirEntrega}
      />
    </div>
  )
}

export default DesignarEntregas
