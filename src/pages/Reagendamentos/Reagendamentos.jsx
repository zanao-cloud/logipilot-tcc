import { useEffect, useState } from 'react'
import api from '../../services/api'
import SidebarOperador from '../../components/SidebarOperador'
import CredentialUser from '../../components/CredentialUser'
import { formatarData } from '../../services/formatadores'
import { hojeISO, horaDaConclusao } from '../../services/entregas'
import styles from './Reagendamentos.module.css'

const amanhaISO = () => {
  const data = new Date()
  data.setDate(data.getDate() + 1)
  return data.toISOString().slice(0, 10)
}

const Reagendamentos = () => {
  const [fila, setFila] = useState([])
  const [motoristas, setMotoristas] = useState([])
  const [escolhas, setEscolhas] = useState({})
  const [carregando, setCarregando] = useState(true)
  const [salvandoId, setSalvandoId] = useState(null)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    Promise.all([api.get('/entregas/reagendamento'), api.get('/usuarios', { params: { papel: 'motorista' } })])
      .then(([respostaFila, respostaMotoristas]) => {
        setFila(respostaFila.data)
        setMotoristas(respostaMotoristas.data.filter((u) => u.papel === 'motorista'))
      })
      .catch((error) => {
        console.error('Erro ao carregar a fila de reagendamento.', error)
        setErro('Não foi possível carregar as entregas a reagendar.')
      })
      .finally(() => setCarregando(false))
  }, [])

  const escolhaDe = (entrega) => escolhas[entrega.id] || {
    data: amanhaISO(),
    motoristaId: String(entrega.motoristaId),
  }

  const alterarEscolha = (entrega, campo, valor) => {
    setEscolhas((atuais) => ({
      ...atuais,
      [entrega.id]: { ...escolhaDe(entrega), [campo]: valor },
    }))
  }

  const reagendar = async (entrega) => {
    const escolha = escolhaDe(entrega)

    if (escolha.data < hojeISO()) {
      setErro('A nova data não pode ser no passado.')
      return
    }

    setSalvandoId(entrega.id)
    setErro('')
    setAviso('')

    try {
      const { data: nova } = await api.post(`/entregas/${entrega.id}/reagendar`, {
        data: escolha.data,
        motoristaId: Number(escolha.motoristaId),
      })

      // A entrega sai da fila assim que gera a nova tentativa.
      setFila((atuais) => atuais.filter((e) => e.id !== entrega.id))
      setAviso(`Pacote ${nova.codigo} reagendado para ${formatarData(nova.data)}.`)
    } catch (error) {
      console.error('Não foi possível reagendar a entrega.', error)
      setErro(error.response?.data?.erro || 'Não foi possível reagendar a entrega.')
    } finally {
      setSalvandoId(null)
    }
  }

  return (
    <div className="app-shell d-flex flex-column flex-md-row">
      <SidebarOperador />

      <main className="app-main flex-grow-1">
        <CredentialUser title="Reagendamentos" />

        {erro && <div className="alert alert-danger" role="alert">{erro}</div>}
        {aviso && <div className="alert alert-success py-2" role="status">{aviso}</div>}

        <div className="content-card card shadow-sm mb-4">
          <div className="card-body">
            <h2 className="h6 mb-1">Entregas sem ninguém no local</h2>
            <p className="mb-0 text-muted">
              Toda parada em que o motorista não encontrou ninguém cai aqui até virar uma nova
              tentativa. A entrega original fica no histórico, e a nova aponta para ela.
            </p>
          </div>
        </div>

        <div className="content-card card shadow-sm">
          <div className="card-body">
            {carregando && <p className="text-muted mb-0">Carregando...</p>}

            {!carregando && fila.length === 0 && (
              <p className="text-muted mb-0">
                Nenhuma entrega esperando reagendamento. Tudo que foi visitado está resolvido.
              </p>
            )}

            <ul className="list-unstyled mb-0">
              {fila.map((entrega) => {
                const escolha = escolhaDe(entrega)

                return (
                  <li key={entrega.id} className={styles.item}>
                    <div className="flex-grow-1 min-w-0">
                      <div className="d-flex flex-wrap align-items-center gap-2">
                        <span className={styles.codigo}>{entrega.codigo}</span>
                        <span className="fw-semibold">{entrega.cliente}</span>
                        <span className="badge bg-danger">Ninguém no local</span>
                      </div>
                      <div className="small text-muted">{entrega.endereco} · {entrega.cidade}</div>
                      <div className="small text-muted">
                        Tentativa de {formatarData(entrega.data)}
                        {horaDaConclusao(entrega) && ` às ${horaDaConclusao(entrega)}`}
                        {' · '}{entrega.volumes} volume(s)
                      </div>
                      {entrega.observacoes && (
                        <div className="small text-primary-emphasis">
                          <i className="fas fa-comment-dots me-1"></i>{entrega.observacoes}
                        </div>
                      )}
                    </div>

                    <div className={styles.acoes}>
                      <div>
                        <label className="form-label small mb-1" htmlFor={`data-${entrega.id}`}>
                          Nova data
                        </label>
                        <input
                          id={`data-${entrega.id}`}
                          type="date"
                          className="form-control form-control-sm"
                          value={escolha.data}
                          min={hojeISO()}
                          onChange={(e) => alterarEscolha(entrega, 'data', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="form-label small mb-1" htmlFor={`motorista-${entrega.id}`}>
                          Motorista
                        </label>
                        <select
                          id={`motorista-${entrega.id}`}
                          className="form-select form-select-sm"
                          value={escolha.motoristaId}
                          onChange={(e) => alterarEscolha(entrega, 'motoristaId', e.target.value)}
                        >
                          {motoristas.map((motorista) => (
                            <option key={motorista.id} value={motorista.id}>{motorista.nome}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-success"
                        onClick={() => reagendar(entrega)}
                        disabled={salvandoId === entrega.id}
                      >
                        <i className="fas fa-rotate me-1"></i>
                        {salvandoId === entrega.id ? 'Reagendando...' : 'Reagendar'}
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Reagendamentos
