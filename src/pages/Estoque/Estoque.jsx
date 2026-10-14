import { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import SidebarOperador from '../../components/SidebarOperador'
import CredentialUser from '../../components/CredentialUser'
import Modal from '../../components/Modal'
import { formatarData } from '../../services/formatadores'
import styles from './Estoque.module.css'

const STATUS = {
  em_estoque: { rotulo: 'Em estoque', cor: 'bg-primary' },
  designado: { rotulo: 'Designado', cor: 'bg-warning text-dark' },
  entregue: { rotulo: 'Entregue', cor: 'bg-success' },
}

const pacoteEmBranco = () => ({
  codigo: '',
  clienteId: '',
  volumes: 1,
  descricao: '',
  pesoKg: '',
  observacoes: '',
})

/** Quantos dias o volume está parado no galpão. */
const diasParado = (recebidoEm) => {
  const dias = Math.floor((Date.now() - new Date(recebidoEm)) / 86400000)
  return dias <= 0 ? 'hoje' : `${dias} dia(s)`
}

const Estoque = () => {
  const [pacotes, setPacotes] = useState([])
  const [clientes, setClientes] = useState([])
  const [form, setForm] = useState(pacoteEmBranco)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('em_estoque')
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [idAExcluir, setIdAExcluir] = useState(null)

  useEffect(() => {
    Promise.all([api.get('/pacotes'), api.get('/clientes')])
      .then(([respostaPacotes, respostaClientes]) => {
        setPacotes(respostaPacotes.data)
        setClientes(respostaClientes.data)
      })
      .catch((error) => {
        console.error('Erro ao carregar o estoque.', error)
        setErro('Não foi possível carregar o estoque.')
      })
      .finally(() => setCarregando(false))
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const receberPacote = async (e) => {
    e.preventDefault()
    setErro('')
    setAviso('')
    setEnviando(true)

    try {
      const { data } = await api.post('/pacotes', {
        codigo: form.codigo.trim().toUpperCase(),
        clienteId: Number(form.clienteId),
        volumes: Number(form.volumes) || 1,
        descricao: form.descricao.trim(),
        pesoKg: form.pesoKg === '' ? null : Number(form.pesoKg),
        observacoes: form.observacoes.trim(),
      })

      setPacotes((atuais) => [data, ...atuais])
      setForm(pacoteEmBranco())
      setAviso(`Pacote ${data.codigo} deu entrada no estoque.`)
    } catch (error) {
      console.error('Não foi possível registrar o pacote.', error)
      setErro(error.response?.data?.erro || 'Não foi possível registrar o pacote.')
    } finally {
      setEnviando(false)
    }
  }

  const excluirPacote = async () => {
    try {
      await api.delete(`/pacotes/${idAExcluir}`)
      setPacotes((atuais) => atuais.filter((p) => p.id !== idAExcluir))
    } catch (error) {
      console.error('Não foi possível excluir o pacote.', error)
      setErro(error.response?.data?.erro || 'Não foi possível excluir o pacote.')
    }
    setIdAExcluir(null)
  }

  // A busca olha código, cliente e descrição de uma vez, porque o operador às
  // vezes só lembra de um dos três.
  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    return pacotes.filter((pacote) => {
      const casaStatus = filtroStatus === 'todos' || pacote.status === filtroStatus
      const casaBusca = termo === ''
        || pacote.codigo.toLowerCase().includes(termo)
        || pacote.cliente.toLowerCase().includes(termo)
        || (pacote.descricao || '').toLowerCase().includes(termo)

      return casaStatus && casaBusca
    })
  }, [pacotes, busca, filtroStatus])

  const contagem = useMemo(() => pacotes.reduce((acumulado, pacote) => ({
    ...acumulado,
    [pacote.status]: (acumulado[pacote.status] || 0) + 1,
  }), {}), [pacotes])

  return (
    <div className="app-shell d-flex flex-column flex-md-row">
      <SidebarOperador />

      <main className="app-main flex-grow-1">
        <CredentialUser title="Estoque de Pacotes" />

        {erro && <div className="alert alert-danger" role="alert">{erro}</div>}
        {aviso && <div className="alert alert-success py-2" role="status">{aviso}</div>}

        <div className="row">
          <div className="col-6 col-md-3 mb-3">
            <div className={styles.indicador}>
              <span className={styles.numero}>{contagem.em_estoque || 0}</span>
              <span className={styles.rotulo}>Em estoque</span>
            </div>
          </div>
          <div className="col-6 col-md-3 mb-3">
            <div className={styles.indicador}>
              <span className={styles.numero}>{contagem.designado || 0}</span>
              <span className={styles.rotulo}>Designados</span>
            </div>
          </div>
          <div className="col-6 col-md-3 mb-3">
            <div className={styles.indicador}>
              <span className={styles.numero}>{contagem.entregue || 0}</span>
              <span className={styles.rotulo}>Entregues</span>
            </div>
          </div>
          <div className="col-6 col-md-3 mb-3">
            <div className={styles.indicador}>
              <span className={styles.numero}>
                {pacotes.filter((p) => p.status === 'em_estoque')
                  .reduce((soma, p) => soma + (p.volumes || 1), 0)}
              </span>
              <span className={styles.rotulo}>Volumes parados</span>
            </div>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-lg-5">
            <form className="content-card card shadow-sm h-100" onSubmit={receberPacote}>
              <div className="card-body">
                <h2 className="h6 mb-3">Entrada de pacote</h2>

                <div className="mb-3">
                  <label className="form-label" htmlFor="codigo">Identificação do pacote</label>
                  <input
                    id="codigo"
                    className={`form-control ${styles.codigo}`}
                    name="codigo"
                    value={form.codigo}
                    onChange={handleChange}
                    placeholder="Ex: CX-1042"
                    maxLength={40}
                    required
                  />
                  <div className="form-text">O que está escrito na etiqueta da caixa.</div>
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="clienteId">Cliente destinatário</label>
                  <select
                    id="clienteId"
                    className="form-select"
                    name="clienteId"
                    value={form.clienteId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selecione um cliente</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="row">
                  <div className="col-6 mb-3">
                    <label className="form-label" htmlFor="volumes">Volumes</label>
                    <input id="volumes" type="number" min="1" step="1" className="form-control" name="volumes" value={form.volumes} onChange={handleChange} required />
                  </div>
                  <div className="col-6 mb-3">
                    <label className="form-label" htmlFor="pesoKg">Peso (kg)</label>
                    <input id="pesoKg" type="number" min="0" step="0.1" className="form-control" name="pesoKg" value={form.pesoKg} onChange={handleChange} placeholder="opcional" />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="descricao">Conteúdo</label>
                  <input id="descricao" className="form-control" name="descricao" value={form.descricao} onChange={handleChange} placeholder="Ex: 3 caixas de filme stretch" />
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="observacoes">Observações</label>
                  <textarea id="observacoes" className="form-control" name="observacoes" rows={2} value={form.observacoes} onChange={handleChange} placeholder="Frágil, empilhar no máximo 2..." />
                </div>

                <button type="submit" className="btn btn-primary w-100" disabled={enviando || clientes.length === 0}>
                  {enviando ? 'Registrando...' : 'Dar entrada no estoque'}
                </button>

                {clientes.length === 0 && (
                  <div className="form-text text-danger mt-2">
                    Nenhum cliente cadastrado. Peça ao gestor para cadastrar os clientes.
                  </div>
                )}
              </div>
            </form>
          </div>

          <div className="col-lg-7">
            <div className="content-card card shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                  <h2 className="h6 mb-0">Pacotes</h2>
                  <span className="badge bg-primary">{visiveis.length} de {pacotes.length}</span>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-sm-7">
                    <label className="visually-hidden" htmlFor="busca">Buscar pacote</label>
                    <input
                      id="busca"
                      className="form-control form-control-sm"
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      placeholder="Buscar por código, cliente ou conteúdo"
                    />
                  </div>
                  <div className="col-sm-5">
                    <label className="visually-hidden" htmlFor="filtroStatus">Filtrar por situação</label>
                    <select
                      id="filtroStatus"
                      className="form-select form-select-sm"
                      value={filtroStatus}
                      onChange={(e) => setFiltroStatus(e.target.value)}
                    >
                      <option value="em_estoque">Em estoque</option>
                      <option value="designado">Designados</option>
                      <option value="entregue">Entregues</option>
                      <option value="todos">Todos</option>
                    </select>
                  </div>
                </div>

                {carregando && <p className="text-muted mb-0">Carregando...</p>}

                {!carregando && visiveis.length === 0 && (
                  <p className="text-muted mb-0">
                    {pacotes.length === 0
                      ? 'Nenhum pacote no sistema. Registre a primeira entrada ao lado.'
                      : 'Nenhum pacote encontrado com esse filtro.'}
                  </p>
                )}

                <ul className="list-unstyled mb-0">
                  {visiveis.map((pacote) => {
                    const info = STATUS[pacote.status] || STATUS.em_estoque

                    return (
                      <li key={pacote.id} className={styles.item}>
                        <div className="flex-grow-1 min-w-0">
                          <div className="d-flex flex-wrap align-items-center gap-2">
                            <span className={styles.etiqueta}>{pacote.codigo}</span>
                            <span className="fw-semibold">{pacote.cliente}</span>
                            <span className={`badge ${info.cor}`}>{info.rotulo}</span>
                          </div>
                          <div className="small text-muted">
                            {pacote.volumes} volume(s)
                            {pacote.pesoKg && ` · ${pacote.pesoKg} kg`}
                            {pacote.cidade && ` · ${pacote.cidade}`}
                          </div>
                          {pacote.descricao && (
                            <div className="small text-muted">{pacote.descricao}</div>
                          )}
                          <div className="small text-muted">
                            Recebido em {formatarData(pacote.recebidoEm?.slice(0, 10))}
                            {pacote.status === 'em_estoque' && ` · parado há ${diasParado(pacote.recebidoEm)}`}
                          </div>
                          {pacote.observacoes && (
                            <div className="small"><i className="fas fa-circle-info me-1 text-muted"></i>{pacote.observacoes}</div>
                          )}
                        </div>

                        {pacote.status === 'em_estoque' && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger flex-shrink-0"
                            onClick={() => setIdAExcluir(pacote.id)}
                            aria-label={`Excluir pacote ${pacote.codigo}`}
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Modal
        isOpen={Boolean(idAExcluir)}
        onClose={() => setIdAExcluir(null)}
        onConfirm={excluirPacote}
      />
    </div>
  )
}

export default Estoque
