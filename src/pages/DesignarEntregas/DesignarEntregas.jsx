import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../../services/api'
import SidebarOperador from '../../components/SidebarOperador'
import CredentialUser from '../../components/CredentialUser'
import Modal from '../../components/Modal'
import { formatarData } from '../../services/formatadores'
import { formatarPlaca, formatarTelefone } from '../../services/formatos'
import {
  calcularKpis,
  foiConcluida,
  hojeISO,
  horaDaConclusao,
  ordenarEntregas,
  statusInfo,
  urlDoComprovante,
} from '../../services/entregas'
import styles from './DesignarEntregas.module.css'

const entregaEmBranco = () => ({
  pacoteId: '',
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
  const [estoque, setEstoque] = useState([])
  const [entregas, setEntregas] = useState([])
  const [form, setForm] = useState(entregaEmBranco)
  const [buscaPacote, setBuscaPacote] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [idEntregaAExcluir, setIdEntregaAExcluir] = useState(null)

  const carregarEstoque = () => api
    .get('/pacotes', { params: { status: 'em_estoque' } })
    .then((resposta) => setEstoque(resposta.data))

  useEffect(() => {
    Promise.all([
      api.get(`/usuarios/${id}`),
      api.get('/pacotes', { params: { status: 'em_estoque' } }),
      api.get('/entregas'),
    ])
      .then(([respostaMotorista, respostaEstoque, respostaEntregas]) => {
        setMotorista(respostaMotorista.data)
        setEstoque(respostaEstoque.data)
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

  // Escolher o pacote já traz o endereço do destinatário, que continua
  // editável (a entrega pode ser numa filial ou num endereço avulso).
  const escolherPacote = (e) => {
    const pacoteId = e.target.value
    const pacote = estoque.find((p) => String(p.id) === String(pacoteId))

    setForm((prev) => ({
      ...prev,
      pacoteId,
      endereco: pacote ? pacote.endereco || prev.endereco : '',
      cidade: pacote ? pacote.cidade || '' : '',
    }))
  }

  // O operador filtra o estoque por código, cliente ou conteúdo antes de
  // escolher — num galpão com muitos volumes, a lista pura não serve.
  const estoqueVisivel = useMemo(() => {
    const termo = buscaPacote.trim().toLowerCase()

    if (termo === '') return estoque

    return estoque.filter((pacote) => pacote.codigo.toLowerCase().includes(termo)
      || pacote.cliente.toLowerCase().includes(termo)
      || (pacote.descricao || '').toLowerCase().includes(termo))
  }, [estoque, buscaPacote])

  const pacoteEscolhido = estoque.find((p) => String(p.id) === String(form.pacoteId))

  const designarEntrega = async (e) => {
    e.preventDefault()
    setErro('')
    setAviso('')

    if (!pacoteEscolhido) {
      setErro('Selecione um pacote do estoque.')
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

      const { data: nova } = await api.post('/entregas', {
        motoristaId: Number(id),
        pacoteId: Number(form.pacoteId),
        endereco: form.endereco.trim(),
        cidade: form.cidade.trim(),
        janelaInicio: form.janelaInicio,
        janelaFim: form.janelaFim,
        distanciaKm: Number(form.distanciaKm) || 0,
        prioridade: form.prioridade,
        observacoesOperador: form.observacoesOperador.trim(),
        data: form.data,
        ordem: maiorOrdem + 1,
      })

      setEntregas((atuais) => [...atuais, nova])
      setForm({ ...entregaEmBranco(), data: form.data })
      setBuscaPacote('')
      // O pacote saiu do estoque: a lista precisa refletir isso na hora.
      await carregarEstoque()
      setAviso(`Pacote ${nova.codigo} designado para ${nova.cliente}.`)
    } catch (error) {
      console.error('Não foi possível designar a entrega.', error)
      setErro(error.response?.data?.erro || 'Não foi possível designar a entrega. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  const excluirEntrega = async () => {
    try {
      await api.delete(`/entregas/${idEntregaAExcluir}`)
      setEntregas((atuais) => atuais.filter((entrega) => entrega.id !== idEntregaAExcluir))
      // Tirar a parada da rota devolve o volume ao galpão.
      await carregarEstoque()
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
                    Placa {formatarPlaca(motorista.placa)} · {formatarTelefone(motorista.telefone)}
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
                <div className="d-flex gap-2">
                  <Link
                    to={`/operador/motoristas/${id}/etiquetas?data=${form.data}`}
                    className="btn btn-sm btn-outline-primary"
                  >
                    <i className="fas fa-tags me-1"></i>Etiquetas
                  </Link>
                  <Link to="/operador/motoristas" className="btn btn-sm btn-outline-primary">
                    <i className="fas fa-arrow-left me-1"></i>Voltar
                  </Link>
                </div>
              </div>
            </div>

            <div className="row g-4">
              <div className="col-lg-5">
                <form className="content-card card shadow-sm h-100" onSubmit={designarEntrega}>
                  <div className="card-body">
                    <h2 className="h6 mb-3">Nova entrega</h2>

                    <div className="mb-2">
                      <label className="form-label" htmlFor="buscaPacote">Buscar no estoque</label>
                      <input
                        id="buscaPacote"
                        className="form-control form-control-sm"
                        value={buscaPacote}
                        onChange={(e) => setBuscaPacote(e.target.value)}
                        placeholder="Código, cliente ou conteúdo"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label" htmlFor="pacoteId">Pacote</label>
                      <select
                        id="pacoteId"
                        className="form-select"
                        name="pacoteId"
                        value={form.pacoteId}
                        onChange={escolherPacote}
                        required
                      >
                        <option value="">
                          {estoqueVisivel.length === 0 ? 'Nenhum pacote encontrado' : 'Selecione um pacote'}
                        </option>
                        {estoqueVisivel.map((pacote) => (
                          <option key={pacote.id} value={pacote.id}>
                            {pacote.codigo} — {pacote.cliente} ({pacote.volumes} vol.)
                          </option>
                        ))}
                      </select>

                      {pacoteEscolhido ? (
                        <div className="form-text">
                          {pacoteEscolhido.volumes} volume(s)
                          {pacoteEscolhido.pesoKg && ` · ${pacoteEscolhido.pesoKg} kg`}
                          {pacoteEscolhido.descricao && ` · ${pacoteEscolhido.descricao}`}
                        </div>
                      ) : (
                        <div className="form-text">
                          {estoque.length} pacote(s) em estoque. A entrada é feita em{' '}
                          <Link to="/operador/estoque">Estoque</Link>.
                        </div>
                      )}

                      {estoque.length === 0 && (
                        <div className="form-text text-danger">
                          Nenhum pacote em estoque. Registre a entrada antes de designar.
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

                    <button type="submit" className="btn btn-primary w-100" disabled={enviando || estoque.length === 0}>
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
                                <span className={styles.codigo}>{entrega.codigo}</span>
                                <span className="fw-semibold">{entrega.cliente}</span>
                                <span className={`badge ${info.cor}`}>{info.rotulo}</span>
                                {entrega.prioridade === 'alta' && <span className="badge bg-danger">Prioridade alta</span>}
                                {entrega.reagendadaDeId && (
                                  <span className="badge bg-secondary">Reagendada</span>
                                )}
                              </div>
                              <div className="small text-muted">{entrega.endereco} · {entrega.cidade}</div>
                              <div className="small text-muted">
                                {entrega.volumes} volume(s) · Janela {entrega.janelaInicio}–{entrega.janelaFim} · {entrega.distanciaKm} km
                                {foiConcluida(entrega) && horaDaConclusao(entrega) && ` · registrada às ${horaDaConclusao(entrega)}`}
                              </div>
                              {entrega.observacoesOperador && (
                                <div className="small"><i className="fas fa-circle-info me-1 text-muted"></i>{entrega.observacoesOperador}</div>
                              )}
                              {entrega.recebidoPor && (
                                <div className="small text-success-emphasis">
                                  <i className="fas fa-signature me-1"></i>Recebido por {entrega.recebidoPor}
                                </div>
                              )}
                              {entrega.observacoes && (
                                <div className="small text-primary-emphasis">
                                  <i className="fas fa-comment-dots me-1"></i>Motorista: {entrega.observacoes}
                                </div>
                              )}
                              {entrega.temComprovante && (
                                <a
                                  className="small"
                                  href={urlDoComprovante(entrega)}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <i className="fas fa-image me-1"></i>Ver foto do comprovante
                                </a>
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
